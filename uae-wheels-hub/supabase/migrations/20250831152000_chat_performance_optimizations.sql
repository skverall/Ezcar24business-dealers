-- Chat performance optimizations

-- 1) Helpful indexes for messages and conversations
CREATE INDEX IF NOT EXISTS idx_messages_listing_sender_receiver
ON public.messages(listing_id, sender_id, receiver_id);

CREATE INDEX IF NOT EXISTS idx_messages_receiver_is_read
ON public.messages(receiver_id, is_read);

CREATE INDEX IF NOT EXISTS idx_messages_listing_created_desc
ON public.messages(listing_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_conversations_buyer_last
ON public.conversations(buyer_id, last_message_at DESC);

CREATE INDEX IF NOT EXISTS idx_conversations_seller_last
ON public.conversations(seller_id, last_message_at DESC);

-- 2) RPC: get_user_conversations - returns user's conversations with latest message, unread count, and related info
CREATE OR REPLACE FUNCTION public.get_user_conversations(
  p_user_id uuid,
  p_limit int DEFAULT 50,
  p_offset int DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  listing_id uuid,
  buyer_id uuid,
  seller_id uuid,
  last_message_at timestamptz,
  listing_title text,
  listing_price numeric,
  listing_make text,
  listing_model text,
  other_full_name text,
  other_avatar_url text,
  unread_count int,
  latest_message text,
  latest_message_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  WITH base AS (
    SELECT c.*,
      CASE WHEN c.buyer_id = p_user_id THEN c.seller_id ELSE c.buyer_id END AS other_user_id
    FROM public.conversations c
    WHERE c.buyer_id = p_user_id OR c.seller_id = p_user_id
    ORDER BY c.last_message_at DESC
    LIMIT p_limit OFFSET p_offset
  ),
  latest AS (
    SELECT b.id AS conversation_id,
           m.id AS message_id,
           m.content AS latest_message,
           m.created_at AS latest_message_at
    FROM base b
    JOIN LATERAL (
      SELECT m1.*
      FROM public.messages m1
      WHERE m1.listing_id = b.listing_id
        AND (
          (m1.sender_id = b.buyer_id AND m1.receiver_id = b.seller_id) OR
          (m1.sender_id = b.seller_id AND m1.receiver_id = b.buyer_id)
        )
      ORDER BY m1.created_at DESC
      LIMIT 1
    ) m ON TRUE
  ),
  unread AS (
    SELECT b.id AS conversation_id, COUNT(*)::int AS unread_count
    FROM base b
    JOIN public.messages m ON m.listing_id = b.listing_id
      AND m.receiver_id = p_user_id
      AND m.is_read = false
      AND (
        (m.sender_id = b.buyer_id AND m.receiver_id = b.seller_id) OR
        (m.sender_id = b.seller_id AND m.receiver_id = b.buyer_id)
      )
    GROUP BY b.id
  )
  SELECT
    b.id,
    b.listing_id,
    b.buyer_id,
    b.seller_id,
    b.last_message_at,
    l.title AS listing_title,
    l.price AS listing_price,
    l.make  AS listing_make,
    l.model AS listing_model,
    p.full_name AS other_full_name,
    p.avatar_url AS other_avatar_url,
    COALESCE(u.unread_count, 0) AS unread_count,
    lt.latest_message,
    lt.latest_message_at
  FROM base b
  LEFT JOIN public.listings l ON l.id = b.listing_id
  LEFT JOIN public.profiles p ON p.user_id = b.other_user_id
  JOIN latest lt ON lt.conversation_id = b.id -- keeps only conversations with at least one message
  LEFT JOIN unread u ON u.conversation_id = b.id
  ORDER BY b.last_message_at DESC;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_conversations(uuid, int, int) TO authenticated;
