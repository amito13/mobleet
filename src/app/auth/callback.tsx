import { useAuthStore } from "@/state/auth-store";
import * as Linking from "expo-linking";
import { useEffect,useState } from "react";
import { useRouter } from "expo-router";
import { useAuth } from "@/hooks/use-auth";
import { ActivityIndicator, View, Text } from "react-native";

export default function AuthCallback() {
    const router = useRouter();
    const handleDeepLink = useAuthStore((s) => s.handleDeepLink);
    const url = Linking.useLinkingURL();
    const [error ,setError] = useState<string | null>(null);

    useEffect(() => {
        if (url) return

        async function finishAuth(){
            try{
                await handleDeepLink(url!);
                router.replace("/");

            }
            catch (err) {
                setError((err as Error).message);
            }
        }
        void finishAuth();
    }, [handleDeepLink,router,url]);
    return(
         <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
        backgroundColor: '#0a0a0c',
      }}
    >
      {!error ? (
        <ActivityIndicator color="#bdf06e" />
      ) : (
        <Text style={{ color: '#fafafa' }}>{error}</Text>
      )}
    </View>
    )
}