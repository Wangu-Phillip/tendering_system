import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { QueryDocumentSnapshot, DocumentSnapshot } from 'firebase-admin/firestore';
import { EventContext } from 'firebase-functions';

admin.initializeApp();
const db = admin.firestore();

// Example: Trigger when a tender is created
export const onTenderCreated = functions.firestore
  .document('tenders/{tenderId}')
  .onCreate(async (snap: QueryDocumentSnapshot, context: EventContext) => {
    const tender = snap.data();
    console.log('New tender created:', tender);
    // Add custom logic here
  });

// Example: Trigger when a bid is submitted
export const onBidSubmitted = functions.firestore
  .document('bids/{bidId}')
  .onUpdate(async (change: functions.Change<QueryDocumentSnapshot>, context: EventContext) => {
    const newBid = change.after.data();
    const oldBid = change.before.data();

    if (newBid.status === 'submitted' && oldBid.status !== 'submitted') {
      console.log('Bid submitted:', newBid);
      // Add notification logic here
    }
  });

// Example: Calculate average bid price
export const calculateBidStats = functions.firestore
  .document('bids/{bidId}')
  .onWrite(async (change: functions.Change<functions.firestore.DocumentSnapshot>, context: EventContext) => {
    const tenderId = change.after.data()?.tenderId;
    if (!tenderId) return;

    const bidsSnapshot = await db.collection('bids').where('tenderId', '==', tenderId).get();
    const bids = bidsSnapshot.docs.map((doc: QueryDocumentSnapshot) => doc.data());
    
    const amounts = bids
      .filter((bid: any) => bid.status === 'submitted')
      .map((bid: any) => bid.amount);
    
    const totalAmount = amounts.reduce((sum: number, amount: number) => sum + amount, 0);
    const averageAmount = amounts.length > 0 ? totalAmount / amounts.length : 0;

    await db.collection('tenders').doc(tenderId).update({
      bidCount: bids.length,
      averageBidPrice: averageAmount,
    });
  });
