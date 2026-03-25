import { useEffect, useState } from 'react';

const BlogPost = ({ post, onBack }) => {
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }, []);

  useEffect(() => {
    const onScroll = () => {
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(docHeight > 0 ? Math.min(100, (window.scrollY / docHeight) * 100) : 0);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleCopy = (text, index) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    });
  };

  const handleShare = (platform) => {
    const url = window.location.href;
    const text = encodeURIComponent(post.title);
    const encodedUrl = encodeURIComponent(url);
    const shareUrls = {
      twitter: `https://twitter.com/intent/tweet?text=${text}&url=${encodedUrl}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    };
    window.open(shareUrls[platform], '_blank', 'noopener,noreferrer,width=600,height=500');
  };

  const renderBlock = (block, index) => {
    switch (block.type) {
      case 'p':
        return <p key={index} className="bp-p">{block.text}</p>;

      case 'h2':
        return <h2 key={index} className="bp-h2">{block.text}</h2>;

      case 'code':
        return (
          <div key={index} className="bp-code-block">
            <div className="bp-code-header">
              {block.lang && (
                <span className="bp-code-lang">{block.lang}</span>
              )}
              <button
                className={`bp-copy-btn${copiedIndex === index ? ' copied' : ''}`}
                onClick={() => handleCopy(block.text, index)}
                aria-label="Copy code"
              >
                {copiedIndex === index ? '✓ Copied!' : 'Copy'}
              </button>
            </div>
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
      {/* Reading progress bar */}
      <div className="bp-progress-bar" style={{ width: `${progress}%` }} />

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
            {/* Social sharing */}
            <div className="bp-share">
              <span className="bp-share-label">Share this article</span>
              <div className="bp-share-btns">
                <button className="bp-share-btn bp-share-x" onClick={() => handleShare('twitter')} aria-label="Share on X">
                  𝕏 Post
                </button>
                <button className="bp-share-btn bp-share-li" onClick={() => handleShare('linkedin')} aria-label="Share on LinkedIn">
                  in Share
                </button>
              </div>
            </div>

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
