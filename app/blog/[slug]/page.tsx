import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { articles, getArticle, topicSlug, type Article } from "../articles";
import {
  getArticlesForTopic,
  getPrimaryTopicForArticle,
  getToolsForTopic,
} from "../../topics/topicData";

type PageProps = {
  params: Promise<{ slug: string }>;
};

const sectionIds = {
  overview: "overview",
  stack: "recommended-stack",
  workflow: "workflow",
  evaluation: "evaluation",
  mistakes: "mistakes",
  metrics: "metrics",
  conclusion: "conclusion",
};

function relatedArticles(article: Article) {
  const sameCategory = articles.filter(
    (item) => item.slug !== article.slug && item.category === article.category
  );
  const fallback = articles.filter((item) => item.slug !== article.slug);
  return [...sameCategory, ...fallback]
    .filter((item, index, list) => list.findIndex((match) => match.slug === item.slug) === index)
    .slice(0, 3);
}

export async function generateStaticParams() {
  return articles.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticle(slug);

  if (!article) {
    return {};
  }

  return {
    title: article.seoTitle,
    description: article.metaDescription,
    openGraph: {
      title: article.seoTitle,
      description: article.metaDescription,
      type: "article",
      publishedTime: article.dateTime,
      images: [article.image],
    },
    twitter: {
      card: "summary_large_image",
      title: article.seoTitle,
      description: article.metaDescription,
      images: [article.image],
    },
  };
}

export default async function ArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const article = getArticle(slug);

  if (!article) {
    notFound();
  }

  const related = relatedArticles(article);
  const primaryTopic = getPrimaryTopicForArticle(article);
  const topicArticles = primaryTopic
    ? getArticlesForTopic(primaryTopic.slug)
        .filter((item) => item.slug !== article.slug)
        .slice(0, 3)
    : [];
  const topicTools = primaryTopic ? getToolsForTopic(primaryTopic.slug).slice(0, 3) : [];

  return (
    <main className="blog-page">
      <article className="seo-article">
        <a href="/blog" className="blog-back-link">
          Back to Blog
        </a>

        <header className="seo-article-hero">
          <div className="article-meta seo-article-meta">
            <a href={primaryTopic ? `/topics/${primaryTopic.slug}` : "/blog"}>{article.category}</a>
            <time dateTime={article.dateTime}>{article.date}</time>
          </div>

          <h1>{article.title}</h1>
          <p>{article.excerpt}</p>

          <img src={article.image} alt="" className="seo-article-cover" />
        </header>

        <nav className="article-toc" aria-labelledby="toc-heading">
          <h2 id="toc-heading">Table of Contents</h2>
          <ol>
            <li>
              <a href={`#${sectionIds.overview}`}>What this guide covers</a>
            </li>
            <li>
              <a href={`#${sectionIds.stack}`}>Recommended tools and setup</a>
            </li>
            <li>
              <a href={`#${sectionIds.workflow}`}>Step-by-step workflow</a>
            </li>
            <li>
              <a href={`#${sectionIds.evaluation}`}>How to evaluate options</a>
            </li>
            <li>
              <a href={`#${sectionIds.mistakes}`}>Common mistakes to avoid</a>
            </li>
            <li>
              <a href={`#${sectionIds.metrics}`}>Metrics that matter</a>
            </li>
          </ol>
        </nav>

        <section id={sectionIds.overview}>
          <h2>What this guide covers</h2>
          <p>
            This guide is written for {article.audience} who are searching for{" "}
            <strong>{article.keyword}</strong> and want advice that can be used in a real
            workflow, not just a list of trendy software names. The goal is to help you{" "}
            {article.promise}.
          </p>
          <p>
            {article.context} That distinction matters because AI and SaaS tools only create
            leverage when they fit the way work already moves through your business. A tool
            that looks impressive in a demo can still fail if the inputs are messy, the team
            does not know when to review outputs, or the workflow creates another place to
            check every morning.
          </p>
          <h3>Who should use this approach</h3>
          <p>
            Use this playbook if you need a practical decision framework. It is especially
            useful when the team has already tried a few apps, sees potential in AI, but
            wants a clearer system for choosing tools, writing prompts, routing outputs, and
            measuring whether the work actually improves.
          </p>
        </section>

        <section id={sectionIds.stack}>
          <h2>Recommended tools and setup</h2>
          <p>
            The strongest setup is usually smaller than expected. Instead of adding every
            new product to the stack, start with the jobs that repeat often and choose tools
            that support those jobs from start to finish.
          </p>
          <ul>
            {article.tools.map((tool) => (
              <li key={tool}>{tool}</li>
            ))}
          </ul>
          <h3>How to keep the stack focused</h3>
          <p>
            Assign each tool a clear role. One product should own the source material, one
            should help transform it, and one should hold the final record or next action.
            If two tools do the same job, keep the one that your team can use consistently
            and remove the other before the workflow becomes harder to maintain.
          </p>
          <p>
            For Softbade readers comparing AI tools and SaaS products, this is the simplest
            rule: buy around a workflow, not around a feature. Features change quickly, but
            the underlying work of researching, deciding, drafting, approving, publishing,
            and reporting stays surprisingly stable.
          </p>
        </section>

        <section id={sectionIds.workflow}>
          <h2>Step-by-step workflow</h2>
          <p>
            A good workflow should be easy to explain to a teammate. It should define the
            input, the transformation, the review step, and the final destination. Use the
            following sequence as a starting point, then adapt it to your team size and
            publishing or operating cadence.
          </p>
          {article.workflow.map((step, index) => (
            <div key={step} className="article-step">
              <h3>
                Step {index + 1}: {step}
              </h3>
              <p>
                Treat this step as a checkpoint, not a vague suggestion. Decide who owns it,
                what information is required, what good output looks like, and where the
                result should live. When AI is involved, add a review standard so the team
                knows when an answer is useful enough to move forward.
              </p>
            </div>
          ))}
        </section>

        <section id={sectionIds.evaluation}>
          <h2>How to evaluate options</h2>
          <p>
            SEO-friendly guides often compare tools by feature count, but feature count is
            rarely the best buying criterion. A better evaluation asks whether the tool
            improves the quality, speed, or consistency of a specific workflow.
          </p>
          <ul>
            {article.evaluation.map((criterion) => (
              <li key={criterion}>{criterion}</li>
            ))}
          </ul>
          <h3>Decision framework</h3>
          <p>
            Score each option from one to five against the criteria above, then add one
            written note for the tradeoff you are accepting. For example, a tool may be
            faster to adopt but weaker for complex workflows, or powerful enough for advanced
            automation but too hard for non-technical teammates to maintain.
          </p>
          <p>
            This keeps the decision grounded. It also creates a useful internal record when
            someone asks why the team chose a specific AI productivity tool, marketing tool,
            automation platform, or SaaS system.
          </p>
        </section>

        <section id={sectionIds.mistakes}>
          <h2>Common mistakes to avoid</h2>
          <p>
            Most weak AI and SaaS implementations fail for ordinary reasons: unclear owners,
            vague prompts, no review step, too many tools, or no metric that proves the
            workflow improved. Watch for these traps before you scale the system.
          </p>
          <ul>
            {article.mistakes.map((mistake) => (
              <li key={mistake}>{mistake}</li>
            ))}
          </ul>
          <h3>How to recover if the workflow gets messy</h3>
          <p>
            Pause expansion and audit one workflow at a time. Remove duplicate apps, rewrite
            unclear prompts, define the final destination for outputs, and put a person in
            charge of reviewing quality. A smaller system that people trust will outperform a
            larger system that nobody wants to maintain.
          </p>
        </section>

        <section id={sectionIds.metrics}>
          <h2>Metrics that matter</h2>
          <p>
            The best metrics connect tool usage to business or creative outcomes. Avoid
            measuring only how many prompts were sent or how many automations were created.
            Those numbers are easy to inflate and do not prove better work.
          </p>
          <ul>
            {article.metrics.map((metric) => (
              <li key={metric}>{metric}</li>
            ))}
          </ul>
          <h3>What good progress looks like</h3>
          <p>
            After two to four weeks, you should see a visible reduction in manual effort or a
            visible improvement in quality. If neither is happening, the tool may still be
            useful, but the workflow needs a sharper job definition, better inputs, or a more
            realistic review process.
          </p>
        </section>

        <section id={sectionIds.conclusion}>
          <h2>Conclusion</h2>
          <p>
            The best way to approach {article.keyword} is to start with the work, not the
            product category. Define the recurring job, choose a focused stack, create a
            repeatable workflow, and measure whether the result saves time or improves the
            quality of decisions and output.
          </p>
          <p>
            Softbade is built to help you compare AI tools, SaaS products, and workflow ideas
            through that practical lens. As you continue exploring, use each article as a
            decision guide: what should this tool help us do, how will we review the output,
            and what metric will tell us it is worth keeping?
          </p>
        </section>

        <section className="related-articles" aria-labelledby="related-heading">
          {primaryTopic ? (
            <>
              <h2>Related Topic</h2>
              <div className="topic-tags">
                <a href={`/topics/${primaryTopic.slug}`}>{primaryTopic.title}</a>
              </div>
            </>
          ) : null}

          {topicTools.length > 0 ? (
            <>
              <h2>Related Tools</h2>
              <div className="related-grid">
                {topicTools.map((tool) => (
                  <a key={tool.slug} href={`/tools/${tool.slug}`} className="related-card">
                    <span>{tool.categories[0]}</span>
                    <h3>{tool.name}</h3>
                    <p>{tool.tagline}</p>
                  </a>
                ))}
              </div>
            </>
          ) : null}

          <h2 id="related-heading">Related Articles</h2>
          <div className="related-grid">
            {(topicArticles.length > 0 ? topicArticles : related).map((item) => (
              <a key={item.slug} href={`/blog/${item.slug}`} className="related-card">
                <span>{item.category}</span>
                <h3>{item.title}</h3>
                <p>{item.excerpt}</p>
              </a>
            ))}
          </div>
        </section>
      </article>
    </main>
  );
}
