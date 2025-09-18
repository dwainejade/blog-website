const BlogContent = ({ content }) => {
  // Handle the nested structure: content is an array, blocks are in content[0].blocks
  if (!content || !Array.isArray(content) || !content[0] || !content[0].blocks) {
    return <div className="text-center text-dark-grey">No content available</div>;
  }

  const blocks = content[0].blocks;

  return (
    <div className="blog-page-content">
      {blocks.map((block, index) => {
        switch (block.type) {
          case "header":
            const HeaderTag = `h${block.data.level}`;
            const getHeaderClass = (level) => {
              switch (level) {
                case 1: return "font-inter text-4xl leading-normal font-bold max-md:text-3xl max-md:leading-snug my-8";
                case 2: return "font-inter text-4xl leading-normal font-bold max-md:text-3xl max-md:leading-snug my-6";
                case 3: return "font-inter text-3xl leading-loose max-md:text-2xl max-md:leading-normal my-6";
                case 4: return "font-gelasio text-xl leading-10 md:text-2xl my-4";
                case 5: return "font-gelasio text-xl leading-10 md:text-2xl my-4";
                case 6: return "font-gelasio text-xl leading-10 md:text-2xl my-4";
                default: return "font-inter text-3xl leading-loose max-md:text-2xl max-md:leading-normal my-6";
              }
            };
            return (
              <HeaderTag
                key={index}
                className={getHeaderClass(block.data.level)}
                dangerouslySetInnerHTML={{ __html: block.data.text }}
              />
            );

          case "paragraph":
            return (
              <p
                key={index}
                className="font-gelasio text-xl leading-10 md:text-2xl my-4"
                dangerouslySetInnerHTML={{ __html: block.data.text }}
              />
            );

          case "list":
            const ListTag = block.data.style === "ordered" ? "ol" : "ul";
            const listClass = block.data.style === "ordered"
              ? "list-decimal list-inside pl-6 my-6 space-y-2"
              : "list-disc list-inside pl-6 my-6 space-y-2";
            return (
              <ListTag key={index} className={listClass}>
                {block.data.items.map((item, itemIndex) => (
                  <li
                    key={itemIndex}
                    className="font-gelasio text-xl leading-10 md:text-2xl"
                    dangerouslySetInnerHTML={{ __html: item }}
                  />
                ))}
              </ListTag>
            );

          case "image":
            return (
              <div key={index} className="my-8">
                <img
                  src={block.data.file.url}
                  alt={block.data.caption || "Blog image"}
                  className="w-full object-cover"
                />
                {block.data.caption && (
                  <p className="text-center text-dark-grey text-sm mt-2">
                    {block.data.caption}
                  </p>
                )}
              </div>
            );

          case "quote":
            return (
              <blockquote
                key={index}
                className="border-l-4 border-purple pl-6 my-8 font-gelasio text-xl leading-10 md:text-2xl italic text-dark-grey"
              >
                <p dangerouslySetInnerHTML={{ __html: block.data.text }} />
                {block.data.caption && (
                  <cite className="block font-gelasio text-xl leading-10 md:text-2xl text-dark-grey/70 mt-2">
                     {block.data.caption}
                  </cite>
                )}
              </blockquote>
            );

          case "code":
            return (
              <pre key={index} className="bg-grey/30 p-4 rounded-md my-6 overflow-x-auto">
                <code className="font-gelasio text-xl leading-10 md:text-2xl">{block.data.code}</code>
              </pre>
            );

          case "embed":
            return (
              <div key={index} className="my-8">
                <div className="relative w-full h-0 pb-[56.25%]">
                  <iframe
                    src={block.data.embed}
                    className="absolute top-0 left-0 w-full h-full rounded-lg border-0"
                    allowFullScreen
                    title={block.data.caption || "Embedded content"}
                  />
                </div>
                {block.data.caption && (
                  <p className="text-center text-dark-grey text-sm mt-2">
                    {block.data.caption}
                  </p>
                )}
              </div>
            );

          default:
            return (
              <div key={index} className="my-4">
                <p className="text-dark-grey">Unsupported block type: {block.type}</p>
              </div>
            );
        }
      })}
    </div>
  );
};

export default BlogContent;