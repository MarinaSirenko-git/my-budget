import ChevronDownIcon from  '@heroicons/react/24/outline/ChevronDownIcon'
import { useState} from 'react'


function SidebarSubmenu(){
    const [isExpanded, setIsExpanded] = useState(false)



    return (
        <div className='flex flex-col'>

            {/** Route header */}
            <div className='w-full block' onClick={() => setIsExpanded(!isExpanded)}>
                <ChevronDownIcon className={'w-5 h-5 mt-1 float-right delay-400 duration-500 transition-all  ' + (isExpanded ? 'rotate-180' : '')}/>
            </div>

            {/** Submenu list */}
            <div className={` w-full `+ (isExpanded ? "" : "hidden")}>
            </div>
        </div>
    )
}

export default SidebarSubmenu