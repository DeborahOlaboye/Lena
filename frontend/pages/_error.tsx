import { NextPageContext } from 'next';
import { ErrorProps } from 'next/error';
import Link from 'next/link';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import ErrorLayout from '../components/layouts/ErrorLayout';

export default function ErrorPage({ statusCode, title }: ErrorProps) {
  const { t } = useTranslation('common');

  if (statusCode === 404) {
    return (
      <ErrorLayout>
        <div className="text-center">
          <h1 className="text-6xl font-bold text-gray-900 dark:text-white">404</h1>
          <h2 className="mt-4 text-2xl font-medium text-gray-700 dark:text-gray-300">
            {t('error.not_found')}
          </h2>
          <p className="mt-2 text-gray-500 dark:text-gray-400">
            {t('error.not_found_message')}
          </p>
          <div className="mt-6">
            <Link
              href="/"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {t('error.go_home')}
            </Link>
          </div>
        </div>
      </ErrorLayout>
    );
  }

  return (
    <ErrorLayout>
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900 dark:text-white">
          {statusCode || 'Error'}
        </h1>
        <h2 className="mt-4 text-2xl font-medium text-gray-700 dark:text-gray-300">
          {t('error.something_went_wrong')}
        </h2>
        <p className="mt-2 text-gray-500 dark:text-gray-400">
          {t('error.please_try_again')}
        </p>
        <div className="mt-6">
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {t('error.reload_page')}
          </button>
        </div>
      </div>
    </ErrorLayout>
  );
}

ErrorPage.getInitialProps = async (context: NextPageContext) => {
  const { err, res, req } = context;
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
  const errorInitialProps: ErrorProps = {
    statusCode,
    title: err?.message || 'An error occurred',
  };

  // Get translations for the error page
  const locale = req?.headers?.['accept-language']?.split(',')?.[0] || 'en';
  
  // Only include translations if we're on the server
  if (req && res) {
    return {
      ...errorInitialProps,
      ...(await serverSideTranslations(locale, ['common'])),
    };
  }

  return errorInitialProps;
};
