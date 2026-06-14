import { Image, ImageSourcePropType, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

const DocumentImage = require('@/assets/images/3d-document.png');

const COLORS = {
    surface: '#ffffff',
    sunken: '#f2f2f7',
    brand: '#6c3bff',
    textPrimary: '#111122',
    pillBg: '#f3eeff',
    textSecondary: '#5a5a70',
    placeholder: '#a0a0ba',
    onBrand: '#ffffff',
    backdrop: 'rgba(17, 17, 34, 0.4)',
};

export function ReadyToHireModal({
    visible,
    taskerName,
    taskerAvatar,
    taskerPrice,
    onClose,
    onSend,
}: {
    visible: boolean;
    taskerName: string;
    taskerAvatar: ImageSourcePropType | null;
    taskerPrice?: string | null;
    onClose: () => void;
    onSend?: (message: string) => void;
}) {
    const insets = useSafeAreaInsets();
    const router = useRouter();

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <Pressable style={styles.backdrop} onPress={onClose}>
                <Pressable style={[styles.sheet, { marginBottom: insets.bottom + 16 }]} onPress={() => { }}>
                    <View style={styles.header}>
                        <Image source={DocumentImage} style={{ width: 64, height: 80 }} />
                        <Text style={styles.title}>Ready to hire this tasker?</Text>
                        <Text style={styles.subtitle}>
                            {"You'll review the final task details before payment is made."}
                        </Text>
                    </View>

                    <View style={styles.body}>
                        <View style={styles.taskerDetails}>
                            <View style={styles.avatarWrap}>
                                {taskerAvatar && (
                                    <Image source={taskerAvatar} style={styles.avatar} />
                                )}
                            </View>
                            <View style={styles.infoWrap}>
                                <Text style={styles.name}>{taskerName}</Text>
                                {taskerPrice && <Text style={styles.price}>{taskerPrice}</Text>}
                            </View>
                        </View>
                        <View style={styles.buttons}>
                            <Pressable
                                style={({ pressed }) => [styles.continueButton, pressed && styles.pressed]}
                                onPress={() => {
                                    onClose();
                                    router.push({
                                        pathname: '/task-agreement',
                                        params: {
                                            taskerName,
                                            taskerPrice: taskerPrice ?? '',
                                        },
                                    });
                                }}>
                                <Text style={styles.continueLabel}>Continue to Agreement</Text>
                            </Pressable>

                            <Pressable style={styles.cancelButton} hitSlop={8} onPress={onClose}>
                                <Text style={styles.cancelLabel}>Cancel</Text>
                            </Pressable>
                        </View>
                    </View>
                </Pressable>
            </Pressable>
        </Modal>
    );
}

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: COLORS.backdrop,
        justifyContent: 'flex-end',
        paddingHorizontal: 16,
    },
    sheet: {
        backgroundColor: COLORS.surface,
        borderRadius: 24,
        paddingHorizontal: 16,
        paddingVertical: 24,
        gap: 16,
    },
    header: {
        gap: 4,
        alignItems: 'center'
    },
    title: {
        fontFamily: 'Geist_700Bold',
        fontSize: 22,
        lineHeight: 28,
        letterSpacing: -0.26,
        color: COLORS.textPrimary,
        textAlign: 'center'
    },
    avatarWrap: {
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: COLORS.pillBg,
        overflow: 'hidden',
    },
    name: {
        fontFamily: 'Geist_600SemiBold',
        fontSize: 17,
        lineHeight: 22,
        letterSpacing: -0.41,
        color: COLORS.textPrimary,
    },
    avatar: {
        width: '100%',
        height: '100%',
        // borderRadius: '100%'
    },
    subtitle: {
        fontFamily: 'Geist_400Regular',
        fontSize: 15,
        lineHeight: 20,
        letterSpacing: -0.24,
        color: COLORS.textSecondary,
        textAlign: 'center'
    },
    body: {
        gap: 24,
    },
    taskerDetails: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    infoWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    price: {
        fontFamily: 'Geist_700Bold',
        fontSize: 17,
        lineHeight: 22,
        letterSpacing: -0.41,
        color: COLORS.brand,
    },
    input: {
        height: 104,
        backgroundColor: COLORS.sunken,
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontFamily: 'Geist_500Medium',
        fontSize: 17,
        lineHeight: 22,
        letterSpacing: -0.41,
        color: COLORS.textPrimary,
    },
    buttons: {
        gap: 8,
    },
    continueButton: {
        height: 48,
        borderRadius: 8,
        backgroundColor: COLORS.brand,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingHorizontal: 20,
    },
    pressed: {
        opacity: 0.9,
    },
    continueLabel: {
        fontFamily: 'Geist_500Medium',
        fontSize: 17,
        letterSpacing: -0.41,
        color: COLORS.onBrand,
    },
    cancelButton: {
        height: 48,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelLabel: {
        fontFamily: 'Geist_500Medium',
        fontSize: 17,
        letterSpacing: -0.41,
        color: COLORS.brand,
    },
});
