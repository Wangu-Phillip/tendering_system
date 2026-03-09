import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();
const db = admin.firestore();

// Trigger when a tender is created
export const onTenderCreated = functions.firestore
  .onDocumentCreated('tenders/{tenderId}', async (event) => {
    const tender = event.data?.data();
    console.log('New tender created:', tender);
    // Add custom logic here
  });

// Trigger when a bid is submitted
export const onBidUpdated = functions.firestore
  .onDocumentUpdated('bids/{bidId}', async (event) => {
    const newBid = event.data?.after.data();
    const oldBid = event.data?.before.data();

    if (newBid?.status === 'submitted' && oldBid?.status !== 'submitted') {
      console.log('Bid submitted:', newBid);
      // Add notification logic here
    }
  });

// Calculate average bid price when bids change
export const calculateBidStats = functions.firestore
  .onDocumentWritten('bids/{bidId}', async (event) => {
    const bidData = event.data?.after.data();
    const tenderId = bidData?.tenderId;
    if (!tenderId) return;

    const bidsSnapshot = await db.collection('bids').where('tenderId', '==', tenderId).get();
    const bids = bidsSnapshot.docs.map((doc) => doc.data());
    
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
