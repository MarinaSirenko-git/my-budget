import XMarkIcon  from '@heroicons/react/24/solid/XMarkIcon'

function RightSidebar(){

    return(
        <div className={" fixed overflow-hidden z-20 bg-gray-900 bg-opacity-25 inset-0 transform ease-in-out " + (true ? " transition-opacity opacity-100 duration-500 translate-x-0  " : " transition-all delay-500 opacity-0 translate-x-full  ")}>
      
            <section className={ "w-80 md:w-96  right-0 absolute bg-base-100 h-full shadow-xl delay-400 duration-500 ease-in-out transition-all transform  " + (true ? " translate-x-0 " : " translate-x-full ")}>
                
                    <div className="relative  pb-5 flex flex-col  h-full">
                        
                        {/* Header */}
                        <div className="navbar   flex pl-4 pr-4 shadow-md ">
                            <button className="float-left btn btn-circle btn-outline btn-sm" onClick={() => close()}>
                            <XMarkIcon className="h-5 w-5"/>
                            </button>
                            <span className="ml-2 font-bold text-xl">Header</span>
                        </div>


                    </div>

            </section>

            <section className="w-screen h-full cursor-pointer"></section>
        </div>
    )
}

export default RightSidebar