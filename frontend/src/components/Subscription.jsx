import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { subscriptionAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Crown, Check, Zap, AlertCircle, Clock, CreditCard, Sparkles } from 'lucide-react';

const Subscription = () => {
    const { currentUser } = useAuth();
    const { t } = useLanguage();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [currentSubscription, setCurrentSubscription] = useState(null);
    const [plans, setPlans] = useState([]);
    const [paymentTimeAllowed, setPaymentTimeAllowed] = useState(false);
    const [nextAvailableTime, setNextAvailableTime] = useState(null);
    const [error, setError] = useState('');
    const [processingPayment, setProcessingPayment] = useState(false);

    useEffect(() => {
        loadData();
        checkPaymentTime();

        const interval = setInterval(checkPaymentTime, 60000);
        return () => clearInterval(interval);
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [subscriptionRes, plansRes] = await Promise.all([
                subscriptionAPI.getMySubscription(),
                subscriptionAPI.getPlans()
            ]);

            setCurrentSubscription(subscriptionRes.data);
            setPlans(plansRes.data.plans);
            setPaymentTimeAllowed(plansRes.data.paymentTimeAllowed);
        } catch (err) {
            console.error('Failed to load subscription data:', err);
            setError('Failed to load subscription data');
        } finally {
            setLoading(false);
        }
    };

    const checkPaymentTime = async () => {
        try {
            const { data } = await subscriptionAPI.checkPaymentTime();
            setPaymentTimeAllowed(data.paymentAllowed);
            setNextAvailableTime(data.nextAvailableTime);
        } catch (err) {
            console.error('Failed to check payment time:', err);
        }
    };

    const handleUpgrade = async (planType) => {
        if (planType === 'free') {
            return;
        }

        if (!paymentTimeAllowed) {
            setError(t('paymentTime'));
            return;
        }

        setError('');
        setProcessingPayment(true);

        try {
            const { data: orderData } = await subscriptionAPI.createOrder(planType);

            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.async = true;
            document.body.appendChild(script);

            script.onload = () => {
                const options = {
                    key: orderData.key,
                    amount: orderData.amount,
                    currency: orderData.currency,
                    name: 'Twitter Clone',
                    description: `Upgrade to ${planType.charAt(0).toUpperCase() + planType.slice(1)} Plan`,
                    order_id: orderData.orderId,
                    handler: async (response) => {
                        try {
                            const verifyData = {
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature,
                                paymentId: orderData.paymentId
                            };

                            await subscriptionAPI.verifyPayment(verifyData);
                            await loadData();

                            alert('Payment successful! Check your email for invoice.');
                            setProcessingPayment(false);
                        } catch (err) {
                            console.error('Payment verification failed:', err);
                            setError('Payment verification failed. Please contact support.');
                            setProcessingPayment(false);
                        }
                    },
                    prefill: {
                        name: currentUser.name,
                        email: currentUser.email,
                    },
                    theme: {
                        color: '#1DA1F2',
                    },
                    modal: {
                        ondismiss: () => {
                            setProcessingPayment(false);
                        }
                    }
                };

                const razorpay = new window.Razorpay(options);
                razorpay.open();
            };

            script.onerror = () => {
                setError('Failed to load payment gateway');
                setProcessingPayment(false);
            };

        } catch (err) {
            console.error('Payment initiation failed:', err);
            if (err.response?.data?.paymentTimeRestriction) {
                setError(err.response.data.message);
            } else {
                setError('Failed to initiate payment. Please try again.');
            }
            setProcessingPayment(false);
        }
    };

    const formatDate = (date) => {
        if (!date) return 'Never';
        return new Date(date).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    const formatNextAvailableTime = () => {
        if (!nextAvailableTime) return '';

        const now = new Date();
        const nextTime = new Date(nextAvailableTime);

        if (nextTime <= now || (nextTime - now) < 60000) {
            return 'Available Now!';
        }

        return nextTime.toLocaleString('en-IN', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getPlanColor = (planType) => {
        switch (planType) {
            case 'bronze': return 'from-orange-600 to-orange-400';
            case 'silver': return 'from-gray-500 to-gray-300';
            case 'gold': return 'from-yellow-500 to-yellow-300';
            default: return 'from-gray-700 to-gray-600';
        }
    };

    const getPlanIcon = (planType) => {
        switch (planType) {
            case 'gold': return <Crown className="w-6 h-6" />;
            case 'silver': return <Sparkles className="w-6 h-6" />;
            case 'bronze': return <Zap className="w-6 h-6" />;
            default: return <CreditCard className="w-6 h-6" />;
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-twitter"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen pb-20">
            {/* Header */}
            <div className="border-b border-gray-800 px-6 py-4 sticky top-0 bg-black z-10">
                <h1 className="text-2xl font-bold">{t('subscriptionPlans')}</h1>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-6">
                {/* Current Subscription Banner */}
                {currentSubscription && (
                    <div className={`bg-gradient-to-r ${getPlanColor(currentSubscription.planType)} rounded-xl p-4 mb-6`}>
                        <div className="flex items-center justify-between flex-wrap gap-4">
                            <div className="flex items-center gap-3">
                                <div className="bg-white bg-opacity-20 p-2 rounded-lg">
                                    {getPlanIcon(currentSubscription.planType)}
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-white">{currentSubscription.planName}</h2>
                                    <p className="text-sm text-white opacity-90">
                                        {currentSubscription.tweetsLimit === -1
                                            ? t('unlimitedTweets')
                                            : `${currentSubscription.tweetsUsed} / ${currentSubscription.tweetsLimit} ${t('tweetsUsed')}`}
                                    </p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-white opacity-75">{t('validUntil')}</p>
                                <p className="text-base font-bold text-white">{formatDate(currentSubscription.endDate)}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Payment Time Warning */}
                {!paymentTimeAllowed && (
                    <div className="bg-red-500 bg-opacity-10 border border-red-500 rounded-xl p-4 mb-6">
                        <div className="flex items-start gap-3">
                            <Clock className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                                <p className="font-bold text-red-500 text-sm">{t('paymentUnavailable')}</p>
                                <p className="text-xs text-red-400 mt-1">
                                    {t('paymentTime')}
                                </p>
                                {nextAvailableTime && (
                                    <p className="text-xs text-red-400 mt-1">
                                        {t('nextAvailable')} <strong>{formatNextAvailableTime()}</strong>
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Error Message */}
                {error && (
                    <div className="bg-red-500 bg-opacity-10 border border-red-500 rounded-xl p-4 mb-6">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-red-500">{error}</p>
                        </div>
                    </div>
                )}

                {/* Plans Grid - Improved Layout */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {plans.map((plan) => {
                        const isCurrentPlan = currentSubscription?.planType === plan.id;
                        const isFree = plan.id === 'free';

                        return (
                            <div
                                key={plan.id}
                                className={`relative rounded-xl border-2 overflow-hidden transition-transform hover:scale-105 ${isCurrentPlan
                                    ? 'border-twitter bg-twitter bg-opacity-5'
                                    : 'border-gray-800 bg-dark'
                                    }`}
                            >
                                {/* Popular Badge */}
                                {plan.id === 'gold' && (
                                    <div className="absolute top-0 right-0 bg-yellow-500 text-black text-xs font-bold px-2 py-1 rounded-bl-lg">
                                        {t('popular')}
                                    </div>
                                )}

                                <div className="p-4">
                                    {/* Plan Icon & Name */}
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className={`bg-gradient-to-br ${getPlanColor(plan.id)} p-2 rounded-lg`}>
                                            {getPlanIcon(plan.id)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-lg font-bold truncate">{plan.name}</h3>
                                        </div>
                                    </div>

                                    {/* Price */}
                                    <div className="mb-4">
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-3xl font-bold">₹{plan.displayAmount}</span>
                                            {!isFree && <span className="text-xs text-gray-400">{t('perMonthShort')}</span>}
                                        </div>
                                    </div>

                                    {/* Tweet Limit */}
                                    <div className="mb-4 bg-twitter bg-opacity-10 rounded-lg p-3">
                                        <p className="text-base font-bold text-twitter">
                                            {plan.tweetsLimit === -1 ? `∞ ${t('unlimited')}` : `${plan.tweetsLimit} ${t('tweets')}`}
                                        </p>
                                        <p className="text-xs text-gray-400">{t('perMonth')}</p>
                                    </div>

                                    {/* Features - Compact */}
                                    <ul className="space-y-2 mb-4">
                                        {plan.features.slice(0, 4).map((feature, index) => (
                                            <li key={index} className="flex items-start gap-2 text-xs">
                                                <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                                                <span className="text-gray-300 leading-tight">{feature}</span>
                                            </li>
                                        ))}
                                    </ul>

                                    {/* Action Button */}
                                    {isCurrentPlan ? (
                                        <div className="bg-twitter bg-opacity-20 border border-twitter text-twitter py-2 rounded-lg text-center font-bold text-sm">
                                            {t('currentPlanBadge')}
                                        </div>
                                    ) : isFree ? (
                                        <div className="bg-gray-700 text-gray-400 py-2 rounded-lg text-center font-bold text-sm">
                                            {t('defaultPlan')}
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => handleUpgrade(plan.id)}
                                            disabled={processingPayment || !paymentTimeAllowed}
                                            className="w-full bg-twitter hover:bg-twitterDark text-white py-2 rounded-lg font-bold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {processingPayment ? t('processing') : t('upgradeNow')}
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Additional Info - Compact */}
                <div className="mt-8 bg-darkHover rounded-xl p-4">
                    <h3 className="text-base font-bold mb-3 flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-twitter" />
                        {t('importantInformation')}
                    </h3>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-gray-400 text-xs">
                        <li className="flex items-start gap-2">
                            <Check className="w-4 h-4 text-twitter flex-shrink-0 mt-0.5" />
                            <span>{t('allPaidPlansValid')}</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <Check className="w-4 h-4 text-twitter flex-shrink-0 mt-0.5" />
                            <span>{t('autoRevertFree')}</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <Check className="w-4 h-4 text-twitter flex-shrink-0 mt-0.5" />
                            <span>{t('tweetCountResets')}</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <Check className="w-4 h-4 text-twitter flex-shrink-0 mt-0.5" />
                            <span>{t('paymentTimeOnly')}</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <Check className="w-4 h-4 text-twitter flex-shrink-0 mt-0.5" />
                            <span>{t('invoiceSentEmail')}</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <Check className="w-4 h-4 text-twitter flex-shrink-0 mt-0.5" />
                            <span>{t('securePayment')}</span>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default Subscription;