import { Skeleton } from "@/components/ui/skeleton";

export const ConversationSkeleton = () => {
  return (
    <div className="flex items-start space-x-3 p-4 w-full">
      {/* Avatar skeleton */}
      <Skeleton className="h-12 w-12 rounded-full shrink-0" />

      <div className="flex-1 space-y-2 min-w-0 pt-1">
        <div className="flex justify-between items-center">
          {/* Name skeleton */}
          <Skeleton className="h-4 w-24" />
          {/* Time skeleton */}
          <Skeleton className="h-3 w-12" />
        </div>

        {/* Car model skeleton */}
        <Skeleton className="h-3 w-32" />

        {/* Message skeleton */}
        <Skeleton className="h-3 w-full max-w-[180px]" />
      </div>
    </div>
  );
};

export const ConversationListSkeleton = () => {
  return (
    <div className="space-y-1">
      {Array.from({ length: 6 }).map((_, index) => (
        <ConversationSkeleton key={index} />
      ))}
    </div>
  );
};

export const MessageSkeleton = ({ isMe = false }: { isMe?: boolean }) => {
  return (
    <div className={`flex items-end gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}>
      {!isMe && <Skeleton className="h-8 w-8 rounded-full mb-1" />}
      <div className={`flex flex-col space-y-1 ${isMe ? 'items-end' : 'items-start'} max-w-[70%]`}>
        <Skeleton className={`h-10 w-48 rounded-2xl ${isMe ? 'rounded-tr-sm' : 'rounded-tl-sm'}`} />
        <Skeleton className="h-3 w-12" />
      </div>
    </div>
  );
};

export const MessageListSkeleton = () => {
  return (
    <div className="space-y-6 p-4">
      <MessageSkeleton />
      <MessageSkeleton isMe />
      <MessageSkeleton />
      <MessageSkeleton isMe />
      <MessageSkeleton />
    </div>
  );
};
