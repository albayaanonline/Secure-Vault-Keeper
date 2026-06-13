import { useEffect } from "react";
import { useLocation } from "wouter";

export default function NewSecret() {
  const [, setLocation] = useLocation();
  useEffect(() => {
    setLocation("/secrets");
  }, []);
  return null;
}
