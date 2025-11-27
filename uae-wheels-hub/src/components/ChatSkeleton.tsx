import { Skeleton } from "@/components/ui/skeleton";

export const ConversationSkeleton = () => {
  return (
    <div className="flex items-center space-x-3 p-4 border-b border-border/20">
      {/* Avatar skeleton */}
      <Skeleton className="h-12 w-12 rounded-full" />
      
      <div className="flex-1 space-y-2">
        {/* Name skeleton */}
        <Skeleton className="h-4 w-32" />
        
        {/* Car model skeleton */}
        <Skeleton className="h-3 w-24" />
        
        {/* Message skeleton */}
        <Skeleton className="h-3 w-40" />
        
        {/* Time skeleton */}
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
  );
};

export const ConversationListSkeleton = () => {
  return (
    <div className="space-y-0">
      {Array.from({ length: 5 }).map((_, index) => (
        <ConversationSkeleton key={index} />
      ))}
    </div>
  );
};

export const MessageSkeleton = () => {
  return (
    <div className="flex items-start space-x-3 p-4">
      {/* Avatar skeleton */}
      <Skeleton className="h-8 w-8 rounded-full" />
      
      <div className="flex-1 space-y-2">
        {/* Message bubble skeleton */}
        <Skeleton className="h-10 w-48 rounded-lg" />
        
        {/* Time skeleton */}
        <Skeleton className="h-3 w-12" />
      </div>
    </div>
  );
};

export const MessageListSkeleton = () => {
  return (
    <div className="space-y-4 p-4">
      {Array.from({ length: 8 }).map((_, index) => (
        <MessageSkeleton key={index} />
      ))}
    </div>
  );
};
