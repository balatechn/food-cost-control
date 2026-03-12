import React, { useState } from 'react';
import PageHeader from '../components/common/PageHeader';
import { HiOutlineBookOpen, HiOutlineChevronDown, HiOutlineChevronRight } from 'react-icons/hi';

const SOP_SECTIONS = [
  {
    title: '1. Daily Opening Procedure',
    icon: '🌅',
    steps: [
      'Login to FoodControl Pro and check Dashboard KPIs.',
      'Review low-stock alerts and place purchase orders for items below minimum level.',
      'Verify previous day\'s closing stock matches today\'s opening stock.',
      'Record any stock adjustments for discrepancies found during physical count.',
      'Check waste logs from previous night — investigate any unusually high waste.',
    ],
  },
  {
    title: '2. Receiving & Purchase SOP',
    icon: '📦',
    steps: [
      'Match delivery items against Purchase Order (PO) — verify quantity, quality, and price.',
      'Weigh all items at receiving dock; reject items that don\'t meet quality standards.',
      'Record purchase in Inventory → Purchase with correct unit cost and supplier.',
      'Store items immediately — FIFO (First In, First Out) in all storage areas.',
      'File supplier invoice and cross-check with PO and receiving report.',
      'Update supplier record if pricing has changed.',
    ],
  },
  {
    title: '3. Stock Issue to Kitchen',
    icon: '🍳',
    steps: [
      'Kitchen submits requisition form (physical or digital) signed by Head Chef.',
      'Store Manager verifies requisition and issues stock via Inventory → Issue Stock.',
      'Ensure issued quantities match requisition exactly — no over-issuing.',
      'Record issue in system with correct date, quantity, and department.',
      'Kitchen acknowledges receipt of stock.',
    ],
  },
  {
    title: '4. Daily Sales Recording',
    icon: '💰',
    steps: [
      'Import or manually enter POS sales data into Sales module by end of each day.',
      'Verify total sales revenue matches POS Z-Report.',
      'Ensure every menu item sale is recorded with correct selling price and quantity.',
      'System auto-calculates theoretical food cost based on recipe costing.',
      'Review daily food cost % — flag if above target (typically 28-35%).',
    ],
  },
  {
    title: '5. Food Cost Calculation',
    icon: '📊',
    steps: [
      'Issue-Based Method: Opening Stock + Purchases - Closing Stock = Cost of Goods Consumed.',
      'Sales-Based Method: Sum of (Recipe Cost × Quantity Sold) for each menu item.',
      'Compare both methods — significant variance indicates recipe non-compliance or waste.',
      'Navigate to Food Cost → Issue-Based and Sales-Based tabs for automated calculations.',
      'Target food cost %: Main Course 28-32%, Starters 20-25%, Desserts 18-22%, Beverages 15-20%.',
      'Investigate items with food cost % above 35% — review recipe, portion size, or purchase price.',
    ],
  },
  {
    title: '6. Variance Analysis',
    icon: '📉',
    steps: [
      'Run variance report weekly (minimum) or daily for high-risk items.',
      'Variance = Actual Usage (Issues) - Theoretical Usage (from Sales).',
      'Positive variance (over-use) = more stock used than recipes require → investigate.',
      'Common causes: over-portioning, theft, spoilage, incorrect recipes, unrecorded waste.',
      'Negative variance (under-use) = less stock used → check for under-portioning or sales not recorded.',
      'Action: Items with >5% variance require immediate investigation and corrective action.',
      'Document findings and corrective actions taken.',
    ],
  },
  {
    title: '7. Waste Management',
    icon: '🗑️',
    steps: [
      'All food waste must be recorded immediately in the Waste Tracking module.',
      'Categories: Spoilage, Over-production, Plate waste, Preparation trim, Expired items.',
      'Waste form requires: item, quantity, reason, and date.',
      'Weekly waste analysis — identify recurring patterns and top waste items.',
      'Target: Total waste should not exceed 2% of food purchases.',
      'Corrective actions: adjust par levels, improve storage, train staff on prep techniques.',
    ],
  },
  {
    title: '8. Recipe Management & Costing',
    icon: '📋',
    steps: [
      'Every menu item must have a standardised recipe card in the system.',
      'Recipe includes: ingredients, quantities (in grams/ml), method, yield, and photo.',
      'Update recipe cost whenever ingredient purchase prices change.',
      'Food Cost % = (Recipe Cost ÷ Selling Price) × 100.',
      'Review menu pricing if food cost % exceeds target — consider price increase or recipe adjustment.',
      'Conduct weekly spot-checks: compare actual dish preparation against recipe card.',
    ],
  },
  {
    title: '9. Menu Engineering',
    icon: '⭐',
    steps: [
      'Run Menu Engineering report monthly from the Menu Engineering module.',
      'Matrix classifies items into: Star (high profit, high popularity), Plow Horse (low profit, high popularity), Puzzle (high profit, low popularity), Dog (low profit, low popularity).',
      'Stars — Maintain quality and visibility, feature prominently on menu.',
      'Plow Horses — Reduce cost (renegotiate supplier, smaller portion) or increase price.',
      'Puzzles — Promote through specials, server recommendations, menu placement.',
      'Dogs — Consider removing from menu, replace with new items, or re-engineer the dish.',
    ],
  },
  {
    title: '10. Monthly Closing & Reporting',
    icon: '📅',
    steps: [
      'Conduct full physical stock count on the last day of each month.',
      'Record closing stock values in the system.',
      'Generate monthly reports: Food Cost Report, Purchase Report, Waste Report, Inventory Valuation.',
      'Compare actual food cost % against budget — prepare variance explanation.',
      'Export reports to CSV for management review and filing.',
      'Present findings in monthly F&B review meeting.',
      'Set action items and targets for the following month.',
    ],
  },
  {
    title: '11. Supplier Management',
    icon: '🚚',
    steps: [
      'Maintain updated supplier database with contact details and product categories.',
      'Review supplier pricing quarterly — obtain competitive quotes from at least 3 suppliers.',
      'Evaluate suppliers on: price, quality, delivery reliability, and credit terms.',
      'Flag and document quality issues — issue formal complaint after 2 occurrences.',
      'Rotate between approved suppliers to prevent dependency on a single source.',
    ],
  },
  {
    title: '12. Key Performance Indicators (KPIs)',
    icon: '🎯',
    steps: [
      'Food Cost % — Target: 28-32% of food revenue.',
      'Beverage Cost % — Target: 18-22% of beverage revenue.',
      'Inventory Turnover — Target: 4-6 times per month (higher = better).',
      'Waste % of Purchases — Target: below 2%.',
      'Variance % — Target: within ±3% of theoretical cost.',
      'Stock Days on Hand — Target: 5-7 days for perishables, 14-21 days for dry goods.',
      'Review KPIs daily on the Dashboard and take immediate action on red flags.',
    ],
  },
];

function AccordionItem({ section, isOpen, onToggle }) {
  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-5 py-4 text-left bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
      >
        <span className="text-2xl">{section.icon}</span>
        <span className="flex-1 font-semibold text-gray-900 dark:text-gray-100">{section.title}</span>
        {isOpen
          ? <HiOutlineChevronDown className="w-5 h-5 text-gray-400" />
          : <HiOutlineChevronRight className="w-5 h-5 text-gray-400" />
        }
      </button>
      {isOpen && (
        <div className="px-5 pb-4 pt-2 bg-gray-50 dark:bg-gray-800/50">
          <ol className="space-y-2">
            {section.steps.map((step, i) => (
              <li key={i} className="flex gap-3 text-sm text-gray-700 dark:text-gray-300">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 flex items-center justify-center text-xs font-bold">
                  {i + 1}
                </span>
                <span className="pt-0.5">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}

export default function HelpPage() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <div>
      <PageHeader
        title="Help & SOP Guide"
        subtitle="Standard Operating Procedures for F&B Cost Control"
      >
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <HiOutlineBookOpen className="w-5 h-5" />
          {SOP_SECTIONS.length} Procedures
        </div>
      </PageHeader>

      <div className="card mb-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center flex-shrink-0">
            <HiOutlineBookOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">F&B Cost Controller Handbook</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              This guide covers all standard operating procedures for managing food cost in a hotel or restaurant.
              Follow these procedures daily to maintain optimal food cost percentages, minimise waste, and maximise profitability.
              Click on any section below to expand the step-by-step procedure.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {SOP_SECTIONS.map((section, i) => (
          <AccordionItem
            key={i}
            section={section}
            isOpen={openIndex === i}
            onToggle={() => setOpenIndex(openIndex === i ? -1 : i)}
          />
        ))}
      </div>
    </div>
  );
}
