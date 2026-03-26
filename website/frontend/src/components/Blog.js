import blogPosts from '../data/blogPosts';

const Blog = ({ onPostClick }) => {

  return (
    <section id="blog" className="blog-section">
      <div className="container">
        <div className="section-head reveal">
          <div className="label">06 — Blog</div>
          <h2>Thoughts &amp;<br />Code</h2>
        </div>

        <div className="blog-grid">
          {blogPosts.map((post) => (
            <article
              key={post.id}
              className="blog-card reveal"
              onClick={() => onPostClick(post.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && onPostClick(post.id)}
            >
              <div className="blog-card-top">
                <div className="blog-tags">
                  {post.tags.map((tag) => (
                    <span key={tag} className="blog-tag">{tag}</span>
                  ))}
                </div>
                <span className="blog-read-time">{post.readTime}</span>
              </div>

              <h3 className="blog-title">{post.title}</h3>

              <p className="blog-excerpt">{post.excerpt}</p>

              <div className="blog-card-bottom">
                <span className="blog-date">{post.date}</span>
                <button
                  className="blog-read-btn"
                  onClick={(e) => { e.stopPropagation(); onPostClick(post.id); }}
                  tabIndex={-1}
                >
                  Read article →
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Blog;
