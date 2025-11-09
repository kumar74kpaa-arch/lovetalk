import type { Message, User } from '@/lib/types';
import { cn } from '@/lib/utils';
import ReactionPicker from './reaction-picker';
import VoicePlayer from './voice-player';

type MessageBubbleProps = {
  message: Message;
  currentUser: User;
  onAddReaction: (messageId: string, emoji: string) => void;
};

export default function MessageBubble({ message, currentUser, onAddReaction }: MessageBubbleProps) {
  const isCurrentUser = message.userId === currentUser.id;
  
  const bubbleClasses = cn(
    'p-3 rounded-2xl max-w-sm md:max-w-md relative group text-foreground',
    {
      'self-end rounded-br-lg': isCurrentUser,
      'self-start rounded-bl-lg': !isCurrentUser,
    }
  );

  const bubbleStyle: React.CSSProperties = isCurrentUser 
    ? { backgroundColor: 'rgba(217, 142, 115, 0.85)' }
    : { backgroundColor: 'rgba(255, 246, 248, 0.85)' };


  const containerClasses = cn('flex', {
    'justify-end': isCurrentUser,
    'justify-start': !isCurrentUser,
  });

  const reactions = message.reactions && Object.entries(message.reactions).filter(([, userIds]) => userIds.length > 0);

  return (
    <div className={containerClasses}>
      <div className={bubbleClasses} style={bubbleStyle}>
        <div className="absolute top-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200" style={isCurrentUser ? {left: '-2rem'} : {right: '-2rem'}}>
            <ReactionPicker onSelect={(emoji) => onAddReaction(message.id, emoji)} />
        </div>
        
        {message.type === 'voice' && message.voiceUrl ? (
          <VoicePlayer src={message.voiceUrl} />
        ) : (
          <p className="whitespace-pre-wrap">{message.text}</p>
        )}
        
        {reactions && reactions.length > 0 && (
          <div className="absolute -bottom-4 flex gap-1" style={isCurrentUser ? {right: '0.5rem'} : {left: '0.5rem'}}>
            {reactions.map(([emoji, userIds]) => (
              <div key={emoji} className="bg-background/70 backdrop-blur-sm rounded-full px-2 py-0.5 text-xs flex items-center gap-1 shadow">
                <span>{emoji}</span>
                <span className="font-semibold text-foreground/80">{userIds.length}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
