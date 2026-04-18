'use client';

import useSound from 'use-sound';

export function useAudio() {
  const [playCorrect] = useSound('/sounds/feedback/correct.ogg', {
    volume: 0.7,
  });

  const [playWrong] = useSound('/sounds/feedback/wrong.ogg', {
    volume: 0.5,
  });

  const [playClick] = useSound('/sounds/ui/click.ogg', {
    volume: 0.4,
  });

  const [playXpGain] = useSound('/sounds/celebration/xp-gain.ogg', {
    volume: 0.6,
  });

  const [playBadge] = useSound('/sounds/celebration/badge.ogg', {
    volume: 0.7,
  });

  return {
    playCorrect,
    playWrong,
    playClick,
    playXpGain,
    playBadge,
    volume: 0.7,
    setVolume: (_v: number) => {
      // Future: global volume context
    },
  };
}