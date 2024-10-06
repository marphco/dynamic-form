import { createContext, useState } from 'react';
import PropTypes from 'prop-types';

export const UserContext = createContext();

export function UserProvider({ children }) {
  const [userResponses, setUserResponses] = useState({});

  const updateUserResponses = (key, value) => {
    setUserResponses((prevResponses) => ({
      ...prevResponses,
      [key]: value,
    }));
  };

  return (
    <UserContext.Provider value={{ userResponses, updateUserResponses }}>
      {children}
    </UserContext.Provider>
  );
}

UserProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
