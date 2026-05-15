import { useEffect, useState } from 'react';

function profileAvatarKey(email: string): string {
  return `liston:profile-media:${email || 'guest'}:avatar`;
}

export function saveProfileAvatar(email: string, src: string): void {
  localStorage.setItem(profileAvatarKey(email), src);
  window.dispatchEvent(new CustomEvent('liston:profile-media-updated'));
}

export function useProfileAvatar(email: string): string | null {
  const key = profileAvatarKey(email);
  const [avatarSrc, setAvatarSrc] = useState<string | null>(() => localStorage.getItem(key));

  useEffect(() => {
    const syncAvatar = () => setAvatarSrc(localStorage.getItem(key));
    syncAvatar();
    window.addEventListener('storage', syncAvatar);
    window.addEventListener('liston:profile-media-updated', syncAvatar);
    return () => {
      window.removeEventListener('storage', syncAvatar);
      window.removeEventListener('liston:profile-media-updated', syncAvatar);
    };
  }, [key]);

  return avatarSrc;
}
