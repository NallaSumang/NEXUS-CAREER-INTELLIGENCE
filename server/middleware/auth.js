import User from "../models/User.js";

export async function verifyToken(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({ error: "Unauthorized: No token provided" });
  }

  try {
    // Local dev mock — restore access until Firebase is configured in production
    if (token.startsWith("mock_")) {
      const email = token.replace("mock_", "");
      let user = await User.findOne({ email });
      if (!user) {
        user = await User.create({
          firebaseUid: `mock_uid_${email}`,
          email,
          name: email.split("@")[0],
        });
      }
      req.user = user;
      return next();
    }

    const admin = (await import("../config/firebase.js")).default;
    const decodedToken = await admin.auth().verifyIdToken(token);

    let user = await User.findOne({ firebaseUid: decodedToken.uid });
    if (!user) {
      user = await User.create({
        firebaseUid: decodedToken.uid,
        email: decodedToken.email,
        name: decodedToken.name || decodedToken.email.split("@")[0],
      });
    }

    req.user = user;
    return next();
  } catch (e) {
    console.error("Firebase Auth Error:", e.message);
    res.status(401).json({ error: "Unauthorized: Invalid token" });
  }
}
