const fetchPremiumStatus = async (userId: string) => {
  try {
    // Read from profiles table instead of subscriptions
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("subscription_status")
      .eq("id", userId)
      .maybeSingle();

    if (error && error.code !== "PGRST116") {
      throw error;
    }

    const isActive = profile?.subscription_status === "active";
    setIsPremium(isActive);
  } catch (error) {
    console.error("Error fetching premium status:", error);
    setIsPremium(false);
  }
};
