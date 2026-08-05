import { ArticleList } from "@/components/articles/article-list";

export default function ArticlesPage() {
  return (
    <>
      <header className="page-heading">
        <div>
          <p className="eyebrow">
            Kontent boshqaruvi
          </p>

          <h1>Elektron maqolalar</h1>

          <p>
            Gazeta betlaridan yaratilgan maqolalarni
            tahrirlang va ommaviy saytga chiqaring.
          </p>
        </div>
      </header>

      <ArticleList />
    </>
  );
}