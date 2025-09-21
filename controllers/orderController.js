import Order from '../models/orderModel.js';
import User from '../models/userModel.js'; 
import crypto from 'crypto';
import Razorpay from 'razorpay';


const addOrderItems = async (req, res) => {
  const {
    orderItems,
    shippingAddress,
    paymentMethod,
    itemsPrice,
    taxPrice,
    shippingPrice,
    totalPrice,
  } = req.body;

  if (orderItems && orderItems.length === 0) {
    res.status(400).json({ message: 'No order items' });
    return;
  } else {
    const order = new Order({
      orderItems: orderItems.map((x) => ({
        ...x,
        product: x._id,
        _id: undefined,
      })),
      user: req.user._id,
      shippingAddress,
      paymentMethod,
      itemsPrice,
      taxPrice,
      shippingPrice,
      totalPrice,
    });

    const createdOrder = await order.save();
    
    const user = await User.findById(req.user._id);
    if(user){
        user.shippingAddress = shippingAddress;
        await user.save();
    }

    res.status(201).json(createdOrder);
  }
};

const getOrderById = async (req, res) => {
  const order = await Order.findById(req.params.id).populate(
    'user',
    'name email'
  );

  if (order) {
    res.json(order);
  } else {
    res.status(404).json({ message: 'Order not found' });
  }
};


const getMyOrders = async (req, res) => {
  const orders = await Order.find({ user: req.user._id });
  res.json(orders);
};

// @desc    Create Razorpay order
// @route   GET /api/orders/:id/razorpay
// @access  Private
const createRazorpayOrder = async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (order) {
    const instance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const options = {
      amount: Math.round(order.totalPrice * 100), // Amount in the smallest currency unit (paise)
      currency: 'INR',
      receipt: order._id.toString(),
    };

    try {
      const razorpayOrder = await instance.orders.create(options);
      res.json({ orderId: razorpayOrder.id, amount: razorpayOrder.amount });
    } catch (error) {
      res.status(500).json({ message: 'Something went wrong with Razorpay' });
    }
  } else {
    res.status(404).json({ message: 'Order not found' });
  }
};

// @desc    Update order to paid after Razorpay verification
// @route   PUT /api/orders/:id/pay
// @access  Private
const updateOrderToPaid = async (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    // This is the verification step
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(body.toString())
        .digest('hex');

    const isAuthentic = expectedSignature === razorpay_signature;

    if (isAuthentic) {
        const order = await Order.findById(req.params.id);
        if (order) {
            order.isPaid = true;
            order.paidAt = Date.now();
            order.paymentResult = {
                id: razorpay_payment_id,
                status: 'COMPLETED',
                update_time: Date.now().toString(),
                email_address: req.user.email,
            };
            const updatedOrder = await order.save();
            res.json(updatedOrder);
        } else {
            res.status(404).json({ message: 'Order not found' });
        }
    } else {
        res.status(400).json({ message: 'Invalid signature' });
    }
};

const updateOrderToDelivered = async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (order) {
    order.isDelivered = true;
    order.deliveredAt = Date.now();

    const updatedOrder = await order.save();
    res.json(updatedOrder);
  } else {
    res.status(404).json({ message: 'Order not found' });
  }
};
const updateOrderToReturned = async (req, res) => {
  const { returnReason } = req.body;
  
  if (!returnReason) {
    res.status(400).json({ message: 'Return reason is required' });
    return;
  }
  
  const order = await Order.findById(req.params.id);

  if (order) {
    if (!order.isDelivered) {
      res.status(400).json({ message: 'Order has not been delivered yet' });
      return;
    }
    
    order.returnDetails = {
      isReturned: true,
      returnReason: returnReason,
      returnedAt: new Date(),
    };

    const updatedOrder = await order.save();
    res.json(updatedOrder);
  } else {
    res.status(404).json({ message: 'Order not found' });
  }
};

const deleteOrder = async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (order) {
    await order.deleteOne();
    res.json({ message: 'Order removed' });
  } else {
    res.status(404).json({ message: 'Order not found' });
  }
};


const getOrders = async (req, res) => {
  const orders = await Order.find({}).populate('user', 'id name');
  res.json(orders);
};

export {
  addOrderItems,
  getOrderById,
  getMyOrders,
  createRazorpayOrder,
  updateOrderToPaid,
  updateOrderToDelivered,
  getOrders,
  updateOrderToReturned,
  deleteOrder,
};

