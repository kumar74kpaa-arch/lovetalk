"use client";

import type { User } from '@/lib/types';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

type UserSwitcherProps = {
  currentUser: User;
  setCurrentUser: (user: User) => void;
  users: User[];
};

export default function UserSwitcher({ currentUser, setCurrentUser, users }: UserSwitcherProps) {
  const handleSwitch = (checked: boolean) => {
    setCurrentUser(checked ? users[1] : users[0]);
  };

  return (
    <div className="fixed bottom-4 right-4 bg-card/80 backdrop-blur-sm p-3 rounded-lg shadow-lg border z-20">
      <div className="flex items-center space-x-2">
        <Label htmlFor="user-switch">Switch User</Label>
        <Switch
          id="user-switch"
          checked={currentUser.id === users[1].id}
          onCheckedChange={handleSwitch}
        />
        <Label htmlFor="user-switch" className="font-bold text-accent">{currentUser.name}</Label>
      </div>
    </div>
  );
}
