import { isValidTag } from './hierarchy';

export function validateTags(tags: string[]): string[] {
  return tags.filter((tag) => !isValidTag(tag));
}
