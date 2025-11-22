// ONLY THE CHANGED PART PROVIDED — YOUR FULL FILE IS UNCHANGED EXCEPT THIS

const handleSubscribe = async () => {
  setLoading(true);

  try {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      toast({
        title: "Please log in first",
        description: "You need to be logged in to subscribe",
        variant: "destructive",
      });
      setLoading(false);
      navigate("/auth?redirect=checkout");   // 🔥 FIXED
      return;
    }

    const res = await fetch(
      "https://zbomenuickrogthnsozb.functions.supabase.co/create-checkout-session",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          priceId: import.meta.env.VITE_STRIPE_PRICE_ID,
        }),
      }
    );

    const data = await res.json();
    if (data.url) window.location.href = data.url;
  } catch (err: any) {
    toast({
      title: "Checkout failed",
      description: err.message,
      variant: "destructive",
    });
    setLoading(false);
  }
};
