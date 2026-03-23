import { useEffect } from 'react';

const BlogPost = ({ post, onBack }) => {
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }, []);

  const renderBlock = (block, index) => {
    switch (block.type) {
      case 'p':
        return <p key={index} className="bp-p">{block.text}</p>;

      case 'h2':
        return <h2 key={index} className="bp-h2">{block.text}</h2>;

      case 'code':
        return (
          <div key={index} className="bp-code-block">
            {block.lang && (
              <div className="bp-code-lang">{block.lang}</div>
            )}
            <pre className="bp-code-body"><code>{block.text}</code></pre>
          </div>
        );

      case 'ul':
        return (
          <ul key={index} className="bp-ul">
            {block.items.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        );

      case 'tip':
        return (
          <div key={index} className="bp-tip">
            {block.text}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <button className="bp-back" onClick={onBack}>
        <span>←</span>
        <span>Back to Blog</span>
      </button>

      <section id="blog-post" className="bp-section">
        <div className="container">

          <header className="bp-header">
            <div className="bp-tags">
              {post.tags.map((tag) => (
                <span key={tag} className="blog-tag">{tag}</span>
              ))}
            </div>

            <h1 className="bp-h1">{post.title}</h1>

            <div className="bp-meta">
              <span>{post.date}</span>
              <span>{post.readTime}</span>
            </div>
          </header>

          <div className="bp-divider" />

          <article className="bp-body">
            {post.content && post.content.map((block, index) => renderBlock(block, index))}
          </article>

          <div className="bp-bottom">
            <button className="bp-back-bottom btn-ghost" onClick={onBack}>
              ← Back to Blog
            </button>
          </div>

        </div>
      </section>
    </>
  );
};

export default BlogPost;
