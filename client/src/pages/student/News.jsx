import { useApi } from '../../api.js';
import { useI18n } from '../../i18n/index.jsx';
import NewsCard from '../../components/NewsCard.jsx';

export default function News() {
  const { t } = useI18n();
  const news = useApi('/news');
  return (
    <div className="flex flex-col gap-5 max-w-3xl w-full mx-auto">
      <h1 className="text-3xl font-semibold">{t('news.title')}</h1>
      {!news.data && !news.error && <p className="text-muted">{t('common.loading')}</p>}
      {news.error && <p className="text-muted">{t('course.connection')}</p>}
      {news.data?.length === 0 && <div className="card p-6 text-muted-soft">{t('news.empty')}</div>}
      {news.data?.map((n) => <NewsCard key={n.id} item={n} />)}
    </div>
  );
}
