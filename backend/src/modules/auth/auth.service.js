const User = require("../user/user.model");
const generateToken = require("../../utils/generateToken");
const generateReferralCode = require("../../utils/generateReferralCode");

/**
 * Register a new user.
 * - Checks for duplicate email/mobile.
 * - Resolves referredBy from the supplied referral code.
 * - Generates a unique referral code for the new user.
 *
 * @param {{ fullName, email, mobile, password, referralCode?: string }} payload
 * @returns {{ token: string, user: object }}
 */
const register = async ({ fullName, email, mobile, password, referralCode: inputCode }) => {
  const existing = await User.findOne({
    $or: [{ email: email.toLowerCase() }, { mobile }],
  }).lean();

  if (existing) {
    const field = existing.email === email.toLowerCase() ? "Email" : "Mobile number";
    throw { status: 409, message: `${field} is already registered.` };
  }

  let referredBy = null;
  if (inputCode) {
    const parent = await User.findOne({ referralCode: inputCode.toUpperCase() }).lean();
    if (!parent) throw { status: 400, message: "Invalid referral code." };
    referredBy = parent._id;
  }

  // Loop until a unique code is found (collision is extremely rare but possible)
  let newCode;
  while (true) {
    newCode = generateReferralCode();
    const taken = await User.exists({ referralCode: newCode });
    if (!taken) break;
  }

  const user = await User.create({
    fullName,
    email,
    mobile,
    password,
    referralCode: newCode,
    referredBy,
  });

  const token = generateToken(user._id);

  return {
    token,
    user: _sanitize(user),
  };
};

/**
 * Authenticate with email + password.
 *
 * @param {{ email: string, password: string }} payload
 * @returns {{ token: string, user: object }}
 */
const login = async ({ email, password }) => {
  // Explicitly select password (it has select:false in schema)
  const user = await User.findOne({ email: email.toLowerCase() }).select("+password");

  if (!user || !(await user.comparePassword(password))) {
    throw { status: 401, message: "Invalid email or password." };
  }

  if (user.accountStatus !== "Active") {
    throw { status: 403, message: "Your account is suspended or inactive." };
  }

  const token = generateToken(user._id);

  return {
    token,
    user: _sanitize(user),
  };
};

/** Strip sensitive fields from the user document before returning. */
const _sanitize = (user) => ({
  id:            user._id,
  fullName:      user.fullName,
  email:         user.email,
  mobile:        user.mobile,
  referralCode:  user.referralCode,
  walletBalance: user.walletBalance,
  accountStatus: user.accountStatus,
  createdAt:     user.createdAt,
});

module.exports = { register, login };
