import { colors, fonts } from "@/lib/theme";
import { useAuthStore } from "@/state/auth-store";
import * as Linking from "expo-linking";
import { useEffect,useState } from "react";
import { useRouter } from "expo-router";
import { ActivityIndicator, View, Text } from "react-native";

export default function AuthCallback() {
    const router = useRouter();
    const handleDeepLink = useAuthStore((s) => s.handleDeepLink);
    const url = Linking.useLinkingURL();
    const [error ,setError] = useState<string | null>(null);

    useEffect(() => {
        if (!url) return
        const callbackUrl = url;

        async function finishAuth(){
            try{
                await handleDeepLink(callbackUrl);
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
        paddingHorizontal: 24,
        backgroundColor: colors.background,
      }}
    >
      {!error ? (
        <>
          <ActivityIndicator color={colors.lime} />
          <Text style={{ color: colors.muted, fontFamily: fonts.mono, fontSize: 12 }}>
            authenticating...
          </Text>
        </>
      ) : (
        <Text style={{ color: colors.danger, fontFamily: fonts.mono, fontSize: 13, textAlign: 'center' }}>
          error: {error}
        </Text>
      )}
    </View>
    )
}
