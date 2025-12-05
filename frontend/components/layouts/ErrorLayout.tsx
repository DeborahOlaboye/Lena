import { ReactNode } from 'react';
import Head from 'next/head';

interface ErrorLayoutProps {
  children: ReactNode;
  title?: string;
}

export default function ErrorLayout({ children, title = 'Error' }: ErrorLayoutProps) {
  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content="An error occurred" />
      </Head>
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="text-center">
            <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white">
              {title}
            </h1>
          </div>
          <div className="mt-8 bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            {children}
          </div>
        </div>
      </div>
    </>
  );
}
