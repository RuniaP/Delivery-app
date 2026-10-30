import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setSessionLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  // Vai trò (customer / staff / admin) và cửa hàng được gán, để chọn giao diện phù hợp.
  // Chưa có profile (vừa đăng ký) thì coi là khách hàng.
  const userId = session?.user.id;
  useEffect(() => {
    if (!userId) {
      setProfile(null);
      return undefined;
    }

    let active = true;
    supabase
      .from('profiles')
      .select('role, store_id')
      .eq('id', userId)
      .maybeSingle()
      .then(({ data }) => {
        if (active) setProfile(data ?? { role: 'customer', store_id: null });
      });
    return () => {
      active = false;
    };
  }, [userId]);

  // Còn chờ nếu chưa biết session, hoặc đã đăng nhập nhưng chưa tải xong profile
  const loading = sessionLoading || (Boolean(session) && !profile);

  // Đăng nhập
  const signIn = (email, password) =>
    supabase.auth.signInWithPassword({ email, password });

  // Đăng ký tài khoản mới + tạo profile tương ứng (role mặc định: customer)
  // Trả về data để biết có tự động đăng nhập luôn không (khi tắt Confirm email)
  const signUp = async (email, password, fullName, phone) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return { data: null, error };

    if (data.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({ id: data.user.id, full_name: fullName, phone, role: 'customer' });
      if (profileError) return { data, error: profileError };
    }
    return { data, error: null };
  };

  const signOut = () => supabase.auth.signOut();

  return (
    <AuthContext.Provider value={{ session, profile, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
