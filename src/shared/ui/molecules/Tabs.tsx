import React, { useState, useEffect } from 'react';

export interface TabItem {
  id: string;
  label: string;
  content: React.ReactNode;
  disabled?: boolean;
}

interface TabsProps {
  /** Array of tab items */
  tabs: TabItem[];
  /** Currently selected tab ID */
  selectedTab?: string;
  /** Callback when tab changes */
  onChange?: (tabId: string) => void;
  /** Additional CSS classes */
  className?: string;
}

const Tabs: React.FC<TabsProps> = ({ 
  tabs, 
  selectedTab, 
  onChange,
  className = '' 
}) => {
  const [activeTabId, setActiveTabId] = useState<string>(selectedTab || tabs[0]?.id || '');

  useEffect(() => {
    if (selectedTab) {
      setActiveTabId(selectedTab);
    }
  }, [selectedTab]);

  const handleTabChange = (tabId: string) => {
    const tab = tabs.find(t => t.id === tabId);
    if (tab && !tab.disabled) {
      setActiveTabId(tabId);
      if (onChange) {
        onChange(tabId);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, tabId: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleTabChange(tabId);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault();
      const enabledTabs = tabs.filter(t => !t.disabled);
      const currentEnabledIndex = enabledTabs.findIndex(t => t.id === activeTabId);
      
      if (e.key === 'ArrowLeft') {
        const prevIndex = currentEnabledIndex > 0 ? currentEnabledIndex - 1 : enabledTabs.length - 1;
        handleTabChange(enabledTabs[prevIndex].id);
      } else {
        const nextIndex = currentEnabledIndex < enabledTabs.length - 1 ? currentEnabledIndex + 1 : 0;
        handleTabChange(enabledTabs[nextIndex].id);
      }
    }
  };

  const activeTab = tabs.find(t => t.id === activeTabId);

  return (
    <div className={className}>
      <div 
        role="tablist" 
        aria-label="Tabs"
        className="flex dark:border-white bg-white dark:bg-black p-1 lg:px-2"
      >
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              aria-controls={`tab-panel-${tab.id}`}
              aria-disabled={tab.disabled}
              tabIndex={isActive ? 0 : -1}
              disabled={tab.disabled}
              onClick={() => handleTabChange(tab.id)}
              onKeyDown={(e) => handleKeyDown(e, tab.id)}
              className={`
                w-full px-3 py-2 text-sm leading-5
                transition-all duration-150
                focus:outline-none focus:ring-0
                ${
                  isActive
                    ? 'border-b border-black dark:border-white dark:bg-white text-black dark:text-black font-bold'
                    : 'bg-white dark:bg-black text-black dark:text-white font-light dark:hover:bg-white dark:hover:text-black'
                }
                ${tab.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
      <div
        role="tabpanel"
        id={`tab-panel-${activeTabId}`}
        aria-labelledby={`tab-${activeTabId}`}
        className="mt-4 dark:border-white bg-white dark:bg-black focus:outline-none"
      >
        {activeTab?.content}
      </div>
    </div>
  );
};

export default Tabs;

