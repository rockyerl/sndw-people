"use client";

import { Tabs } from "@mantine/core";

export interface TabBarItem {
  key: string;
  label: string;
  icon?: React.ElementType;
}

export interface TabBarProps<T extends string = string> {
  tabs: TabBarItem[];
  activeTab: T;
  onTabChange: (key: T) => void;
  className?: string;
}

export function TabBar<T extends string = string>({ tabs, activeTab, onTabChange, className }: TabBarProps<T>) {
  return (
    <div className="w-full overflow-x-auto scrollbar-none pb-1">
      <Tabs
        value={activeTab}
        onChange={(value) => { if (value) onTabChange(value as T); }}
        className={className}
        radius="md"
        styles={{
          list: {
            display: "flex",
            flexWrap: "nowrap",
            gap: "4px",
            borderBottom: "1px solid #E2E8F0",
          },
          tab: {
            whiteSpace: "nowrap",
            flexShrink: 0,
            fontSize: "13px",
            fontWeight: 600,
          },
        }}
      >
        <Tabs.List>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <Tabs.Tab
                key={tab.key}
                value={tab.key}
                leftSection={Icon ? <Icon size={16} /> : undefined}
              >
                {tab.label}
              </Tabs.Tab>
            );
          })}
        </Tabs.List>
      </Tabs>
    </div>
  );
}
