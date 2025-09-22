export const calculateReadingTime = (content) => {
  if (!content || !Array.isArray(content) || !content[0] || !content[0].blocks) {
    return 0;
  }

  const blocks = content[0].blocks;
  let totalWords = 0;

  blocks.forEach(block => {
    let text = '';

    switch (block.type) {
      case 'header':
      case 'paragraph':
      case 'quote':
        text = block.data.text || '';
        break;
      case 'list':
        text = (block.data.items || []).join(' ');
        break;
      case 'code':
        text = block.data.code || '';
        break;
      default:
        text = '';
    }

    // Remove HTML tags and count words
    const plainText = text.replace(/<[^>]*>/g, '');
    const words = plainText.trim().split(/\s+/).filter(word => word.length > 0);
    totalWords += words.length;
  });

  // Average reading speed: 238 words per minute (Medium's standard)
  const wordsPerMinute = 238;
  const readingTimeMinutes = Math.ceil(totalWords / wordsPerMinute);

  return readingTimeMinutes;
};

export const formatReadingTime = (minutes) => {
  if (minutes < 1) return "< 1 min read";
  return `${minutes} min read`;
};