import React, { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../../context/userContext";
import { getInitials } from "../../utils/helper";

const ProfileInfoCard = () => {
  const { user, clearUser } = useContext(UserContext);
  const navigate = useNavigate();
  const [imgError, setImgError] = useState(false);

  const handleLogout = () => {
    localStorage.clear();
    clearUser();
    navigate("/");
  };

  return user && (
    <div className="flex items-center">
      {!imgError && user?.profileImageUrl ? (
        <img
          src={user.profileImageUrl}
          alt="Profile"
          className="w-11 h-11 bg-gray-300 rounded-full mr-3 object-cover"
          onError={() => setImgError(true)}
        />
      ) : (
        <div className="w-11 h-11 flex items-center justify-center bg-amber-100 text-amber-600 font-semibold rounded-full mr-3 text-sm border border-amber-300">
          {getInitials(user.name)}
        </div>
      )}

      <div>
        <div className="text-[15px] text-black font-bold leading-3">{user.name || ""}</div>

        <button className="text-amber-600 text-sm font-semibold cursor-pointer hover:underline" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </div>
  );
};

export default ProfileInfoCard;
