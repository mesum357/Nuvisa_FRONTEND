import { useState, useEffect } from "react";
import { User, MapPin, Globe } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { motion } from "framer-motion";
import useParsedUser from "@/hooks/useParsedUser";

// ---- ProfileSection moved outside ----
const ProfileSection = ({ icon, title, children }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-[#23232B] rounded-xl shadow-sm p-6 border border-[#423577] mb-6"
  >
    <div className="flex items-center mb-4">
      <div className="bg-purple-100 p-2 rounded-lg text-[#7350FF] mr-3">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-white">{title}</h3>
    </div>
    {children}
  </motion.div>
);

// ---- ProfileField moved outside ----
const ProfileField = ({
  label,
  value,
  name,
  editable = true,
  isEditing,
  handleInputChange,
}) => (
  <div className="mb-4">
    <label className="block text-sm font-medium text-gray-400 mb-1">
      {label}
    </label>
    {isEditing && editable ? (
      <input
        type="text"
        name={name}
        value={value}
        onChange={handleInputChange}
        className="w-full px-3 py-2 border border-[#423577] rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
      />
    ) : (
      <p className="text-white">{value || "Not provided"}</p>
    )}
  </div>
);

const Index = () => {
  const [isEditing, setIsEditing] = useState(false);
  const { parsedUserData } = useParsedUser();

  const [userData, setUserData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    dob: "",
    nationality: "",
    passportNumber: "",
    passportExpiry: "",
  });

  useEffect(() => {
    if (parsedUserData && Object.keys(parsedUserData).length > 0) {
      setUserData({
        name:
          parsedUserData.firstName && parsedUserData.lastName
            ? `${parsedUserData.firstName} ${parsedUserData.lastName}`
            : parsedUserData.name || parsedUserData.firstName || "",
        email: parsedUserData.email || "",
        phone: parsedUserData.phone || parsedUserData.phoneNumber || "",
        address: parsedUserData.address || "",
        dob: parsedUserData.dob || parsedUserData.dateOfBirth || "",
        nationality: parsedUserData.nationality || "",
        passportNumber: parsedUserData.passportNumber || "",
        passportExpiry: parsedUserData.passportExpiry || "",
      });
    }
  }, [parsedUserData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUserData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = () => {
    setIsEditing(false);
    // send updated data to backend here
  };

  return (
    <div className="min-h-screen pri_bg !text-white">
      <Header />

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-1">
            <form onSubmit={(e) => e.preventDefault()}>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-gilroy-bold text-white">
                  Personal Information
                </h2>
                {isEditing ? (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 border border-[#423577] rounded-lg text-white  transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSave}
                      className="px-4 py-2 bg-[#7350FF] text-white rounded-lg hover:bg-[#6247D3] transition"
                    >
                      Save Changes
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 bg-[#7350FF] text-white rounded-lg hover:bg-[#6247D3] transition"
                  >
                    Edit Profile
                  </button>
                )}
              </div>

              <ProfileSection
                icon={<User size={20} />}
                title="Basic Information"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ProfileField
                    key="name"
                    label="Full Name"
                    value={userData.name}
                    name="name"
                    isEditing={isEditing}
                    handleInputChange={handleInputChange}
                  />
                  <ProfileField
                    key="dob"
                    label="Date of Birth"
                    value={userData.dob}
                    name="dob"
                    isEditing={isEditing}
                    handleInputChange={handleInputChange}
                  />
                  <ProfileField
                    key="email"
                    label="Email"
                    value={userData.email}
                    name="email"
                    isEditing={isEditing}
                    handleInputChange={handleInputChange}
                  />
                  <ProfileField
                    key="phone"
                    label="Phone Number"
                    value={userData.phone}
                    name="phone"
                    isEditing={isEditing}
                    handleInputChange={handleInputChange}
                  />
                </div>
              </ProfileSection>

              <ProfileSection icon={<MapPin size={20} />} title="Address">
                <ProfileField
                  key="address"
                  label="Current Address"
                  value={userData.address}
                  name="address"
                  isEditing={isEditing}
                  handleInputChange={handleInputChange}
                />
              </ProfileSection>

              <ProfileSection
                icon={<Globe size={20} />}
                title="Nationality & Passport"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ProfileField
                    key="nationality"
                    label="Nationality"
                    value={userData.nationality}
                    name="nationality"
                    isEditing={isEditing}
                    handleInputChange={handleInputChange}
                  />
                  <ProfileField
                    key="passportNumber"
                    label="Passport Number"
                    value={userData.passportNumber}
                    name="passportNumber"
                    editable={false}
                    isEditing={isEditing}
                    handleInputChange={handleInputChange}
                  />
                  <ProfileField
                    key="passportExpiry"
                    label="Passport Expiry"
                    value={userData.passportExpiry}
                    name="passportExpiry"
                    editable={false}
                    isEditing={isEditing}
                    handleInputChange={handleInputChange}
                  />
                </div>
              </ProfileSection>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
