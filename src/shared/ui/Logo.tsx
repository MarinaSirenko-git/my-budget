import { EnvelopeIcon, BanknotesIcon } from '@heroicons/react/24/outline';

export default function Logo() {

  const containerClass = `pl-1 flex items-center font-bold`;

  const content = (
    <>
      <div className="flex items-center gap-1">
        <EnvelopeIcon className='w-8 h-8 text-black dark:text-white' />
        <BanknotesIcon className='w-8 h-8 text-black dark:text-white' />
      </div>
    </>
  );

  return (
    <div className={containerClass}>
      {content}
    </div>
  );
}

