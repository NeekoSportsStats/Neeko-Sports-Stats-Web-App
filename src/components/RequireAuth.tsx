// --------------------------
// SIGNUP
// --------------------------
passwordSchema.parse(password);

if (password !== confirmPassword)
  throw new Error("Passwords do not match");

console.log("🟦 SIGNUP DEBUG:", { email, password, confirmPassword });

// ❗ IMPORTANT: Do NOT include redirect_to
const { data, error } = await supabase.auth.signUp({
  email,
  password
});

if (error?.status === 422) {
  toast({
    title: "Account already exists",
    description: "Please sign in instead.",
    variant: "destructive",
  });
  return;
}

if (error) throw error;

toast({
  title: "Account created!",
  description: "You can now sign in.",
});

// ❗ DON'T SWITCH TO LOGIN AUTOMATICALLY
// setIsLogin(true);

return;
