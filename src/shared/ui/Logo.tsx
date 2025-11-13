export default function Logo() {

  const containerClass = `pl-1 flex items-end font-bold gap-2`;

  const content = (
    <>
      <img src="/src/assets/logo1.webp" alt="Logo" className='w-12 h-12' />
      <p className='text-xl text-mainTextColor dark:text-mainTextColor leading-none'>Mousie</p>
      
    </>
  );

  return (
    <div className={containerClass}>
      {content}
    </div>
  );
}

