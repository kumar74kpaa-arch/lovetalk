import { Heart } from 'lucide-react';

type ChatHeaderProps = {
  loveStreak: number;
};

export default function ChatHeader({ loveStreak }: ChatHeaderProps) {
  return (
    <header className="flex items-center justify-between p-4 border-b border-white/20 shrink-0 backdrop-blur-sm bg-background/30 sticky top-0 z-10">
      <h1 className="text-3xl font-bold font-headline text-accent">Hiii</h1>
      <div className="flex items-center gap-2 text-foreground">
        <Heart className="text-accent fill-accent" size={20} />
        <span className="font-semibold">{loveStreak > 0 ? loveStreak : 0}</span>
        <span className="text-sm">day streak</span>
      </div>
    </header>
  );
}
