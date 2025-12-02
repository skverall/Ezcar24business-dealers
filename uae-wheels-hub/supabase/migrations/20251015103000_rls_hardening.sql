-- RLS hardening for chat, media, roles, and admin tables

-- Messages: ensure only participants can read/write
DROP POLICY IF EXISTS "Users can view messages they sent or received" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
DROP POLICY IF EXISTS "Users can update their received messages" ON public.messages;

CREATE POLICY messages_select_participants
ON public.messages
FOR SELECT USING (auth.uid() IN (sender_id, receiver_id));

CREATE POLICY messages_insert_participants
ON public.messages
FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY messages_update_receivers
ON public.messages
FOR UPDATE USING (auth.uid() = receiver_id)
WITH CHECK (auth.uid() = receiver_id);

-- Conversations: guard both read and updates to participants only
DROP POLICY IF EXISTS "Users can view their conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can create conversations" ON public.conversations;

CREATE POLICY conversations_select_participants
ON public.conversations
FOR SELECT USING (auth.uid() IN (buyer_id, seller_id));

CREATE POLICY conversations_insert_participants
ON public.conversations
FOR INSERT WITH CHECK (auth.uid() IN (buyer_id, seller_id));

CREATE POLICY conversations_update_participants
ON public.conversations
FOR UPDATE USING (auth.uid() IN (buyer_id, seller_id))
WITH CHECK (auth.uid() IN (buyer_id, seller_id));

-- Listing images: public can only see approved/active listings; owners manage their own
DROP POLICY IF EXISTS "Images readable public" ON public.listing_images;
DROP POLICY IF EXISTS "Images manageable by owner" ON public.listing_images;

CREATE POLICY listing_images_public_read
ON public.listing_images
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.listings l
    WHERE l.id = listing_images.listing_id
      AND l.deleted_at IS NULL
      AND COALESCE(l.is_draft, false) = false
      AND COALESCE(l.moderation_status, 'approved') = 'approved'
      AND l.status = 'active'
  )
);

CREATE POLICY listing_images_owner_manage
ON public.listing_images
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.listings l
    WHERE l.id = listing_images.listing_id
      AND l.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.listings l
    WHERE l.id = listing_images.listing_id
      AND l.user_id = auth.uid()
  )
);

-- User roles: explicit admin-only writes, users can read their own roles
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;

CREATE POLICY user_roles_select_self
ON public.user_roles
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY user_roles_admin_write
ON public.user_roles
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  )
);

-- Admin tables: block direct DML from anon/authenticated (use secure functions instead)
REVOKE ALL ON public.admin_users FROM anon, authenticated;
REVOKE ALL ON public.admin_sessions FROM anon, authenticated;
REVOKE ALL ON public.admin_activity_log FROM anon, authenticated;
REVOKE ALL ON public.admin_activities FROM anon, authenticated;
