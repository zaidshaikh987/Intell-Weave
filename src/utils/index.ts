export function createPageUrl(name: string) {
  switch (name) {
    case 'Feed':
      return '/feed';
    case 'Upload':
      return '/upload';
    case 'Discover':
      return '/discover';
    case 'Search':
      return '/search';
    case 'Bookmarks':
      return '/bookmarks';
    default:
      return `/${name.toLowerCase()}`;
  }
}
