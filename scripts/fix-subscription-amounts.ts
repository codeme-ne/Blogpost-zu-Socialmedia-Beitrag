/**
 * Data Integrity Audit Script for Subscription Amounts
 *
 * Purpose: Audit and fix incorrect subscription amounts in the database
 * This script checks all subscriptions and ensures the amounts match
 * the correct prices defined in app.config.ts
 *
 * Usage: npx tsx scripts/fix-subscription-amounts.ts [--dry-run]
 */

import { createClient } from '@supabase/supabase-js';
import '../src/config/app.config';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('  - SUPABASE_URL or VITE_SUPABASE_URL');
  console.error('  - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Initialize Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Get command line arguments
const isDryRun = process.argv.includes('--dry-run');

// Define correct prices (in cents)
const CORRECT_PRICES = {
  monthly: 2900, // 29 EUR
  yearly: 29900, // 299 EUR
};

interface SubscriptionRow {
  id: string;
  user_id: string;
  interval: 'monthly' | 'yearly';
  amount: number | null;
  currency: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  is_active: boolean;
  status: string;
  updated_at: string;
}

async function auditSubscriptions() {
  console.log('🔍 Starting subscription amount audit...');
  if (isDryRun) {
    console.log('📝 Running in DRY RUN mode - no changes will be made');
  }
  console.log('');

  try {
    // Fetch all subscriptions
    const { data: subscriptions, error } = await supabase
      .from('subscriptions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching subscriptions:', error);
      return;
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log('ℹ️  No subscriptions found in database');
      return;
    }

    console.log(`📊 Found ${subscriptions.length} subscriptions to audit\n`);

    let correctCount = 0;
    let incorrectCount = 0;
    let missingCount = 0;
    const updates: Array<{ id: string; oldAmount: number | null; newAmount: number }> = [];

    // Audit each subscription
    for (const sub of subscriptions as SubscriptionRow[]) {
      const expectedAmount = CORRECT_PRICES[sub.interval];

      if (sub.amount === null) {
        missingCount++;
        console.log(`⚠️  Missing amount for subscription ${sub.id}`);
        console.log(`   User: ${sub.user_id}`);
        console.log(`   Interval: ${sub.interval}`);
        console.log(`   Expected: ${expectedAmount} (${expectedAmount / 100} EUR)`);
        console.log(`   Status: ${sub.status} | Active: ${sub.is_active}`);

        updates.push({ id: sub.id, oldAmount: null, newAmount: expectedAmount });
      } else if (sub.amount !== expectedAmount) {
        incorrectCount++;
        console.log(`❌ Incorrect amount for subscription ${sub.id}`);
        console.log(`   User: ${sub.user_id}`);
        console.log(`   Interval: ${sub.interval}`);
        console.log(`   Current: ${sub.amount} (${sub.amount / 100} EUR)`);
        console.log(`   Expected: ${expectedAmount} (${expectedAmount / 100} EUR)`);
        console.log(`   Difference: ${expectedAmount - sub.amount} (${(expectedAmount - sub.amount) / 100} EUR)`);
        console.log(`   Status: ${sub.status} | Active: ${sub.is_active}`);

        updates.push({ id: sub.id, oldAmount: sub.amount, newAmount: expectedAmount });
      } else {
        correctCount++;
      }

      if ((incorrectCount + missingCount) > 0 && (incorrectCount + missingCount) % 5 === 0) {
        console.log(''); // Add spacing every 5 issues for readability
      }
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📈 AUDIT SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Correct amounts: ${correctCount}`);
    console.log(`❌ Incorrect amounts: ${incorrectCount}`);
    console.log(`⚠️  Missing amounts: ${missingCount}`);
    console.log(`📝 Total updates needed: ${updates.length}`);
    console.log('');

    // Apply fixes if not in dry run mode and there are updates
    if (updates.length > 0) {
      if (isDryRun) {
        console.log('🔒 DRY RUN: No changes were made to the database');
        console.log('💡 Run without --dry-run flag to apply these fixes');
      } else {
        console.log('🔧 Applying fixes...\n');

        let successCount = 0;
        let failCount = 0;

        for (const update of updates) {
          const { error: updateError } = await supabase
            .from('subscriptions')
            .update({
              amount: update.newAmount,
              currency: 'eur', // Ensure currency is set
              updated_at: new Date().toISOString(),
            })
            .eq('id', update.id);

          if (updateError) {
            failCount++;
            console.error(`❌ Failed to update subscription ${update.id}:`, updateError);
          } else {
            successCount++;
            console.log(`✅ Updated subscription ${update.id}: ${update.oldAmount} → ${update.newAmount}`);
          }
        }

        console.log('\n' + '='.repeat(60));
        console.log('🎯 UPDATE RESULTS');
        console.log('='.repeat(60));
        console.log(`✅ Successfully updated: ${successCount}`);
        if (failCount > 0) {
          console.log(`❌ Failed updates: ${failCount}`);
        }
      }
    } else {
      console.log('🎉 All subscription amounts are correct! No updates needed.');
    }

    // Additional validation checks
    console.log('\n' + '='.repeat(60));
    console.log('🔍 ADDITIONAL VALIDATION');
    console.log('='.repeat(60));

    // Check for subscriptions with mismatched interval and amount
    const mismatchedSubs = (subscriptions as SubscriptionRow[]).filter(sub => {
      if (!sub.amount) return false;
      if (sub.interval === 'monthly' && sub.amount === CORRECT_PRICES.yearly) return true;
      if (sub.interval === 'yearly' && sub.amount === CORRECT_PRICES.monthly) return true;
      return false;
    });

    if (mismatchedSubs.length > 0) {
      console.log(`⚠️  Found ${mismatchedSubs.length} subscriptions with mismatched interval/amount:`);
      mismatchedSubs.forEach(sub => {
        console.log(`   - ID: ${sub.id} | Interval: ${sub.interval} | Amount: ${sub.amount}`);
      });
    } else {
      console.log('✅ No interval/amount mismatches found');
    }

    // Check for active subscriptions without Stripe IDs
    const activeWithoutStripe = (subscriptions as SubscriptionRow[]).filter(sub =>
      sub.is_active && (!sub.stripe_customer_id || !sub.stripe_subscription_id)
    );

    if (activeWithoutStripe.length > 0) {
      console.log(`\n⚠️  Found ${activeWithoutStripe.length} active subscriptions without Stripe IDs:`);
      activeWithoutStripe.forEach(sub => {
        console.log(`   - ID: ${sub.id} | User: ${sub.user_id}`);
      });
    } else {
      console.log('✅ All active subscriptions have Stripe IDs');
    }

    console.log('\n✨ Audit complete!');

  } catch (error) {
    console.error('❌ Unexpected error during audit:', error);
    process.exit(1);
  }
}

// Run the audit
auditSubscriptions()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });