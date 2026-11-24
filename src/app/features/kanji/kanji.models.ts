export interface Card {
  id: string;
  front: { phrase: string; furigana: string; word: string; notes: string };
  back: { fullPhrase: string; reading: string; meaning: string; notes: string };
  tags: string[];
}
