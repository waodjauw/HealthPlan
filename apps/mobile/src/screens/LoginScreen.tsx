import { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { useAuth } from '../store/auth'
import { useTheme } from '../store/theme'

export function LoginScreen({ navigation }: { navigation: any }) {
  const { colors } = useTheme()
  const { primaryInk } = colors
  const { login } = useAuth()
  const [account, setAccount] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit() {
    if (!account.trim() || !password) {
      setError('请输入账号和密码')
      return
    }
    setLoading(true)
    setError('')
    try {
      await login(account.trim(), password)
    } catch (e: any) {
      setError(e?.response?.data?.message ?? '登录失败，请检查账号或密码')
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: colors.bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.inner}>
        <View style={[styles.logoBox, { backgroundColor: colors.primaryFill }]}>
          <Text style={[styles.logo, { color: colors.primary }]}>轻</Text>
        </View>
        <Text style={[styles.appName, { color: colors.text }]}>轻卡</Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>
          记录每一餐，看清碳蛋脂
        </Text>

        <TextInput
          style={[styles.input, { backgroundColor: colors.cardAlt, color: colors.text }]}
          placeholder="邮箱或用户名"
          placeholderTextColor={colors.placeholder}
          value={account}
          onChangeText={setAccount}
          autoCapitalize="none"
        />
        <TextInput
          style={[styles.input, { backgroundColor: colors.cardAlt, color: colors.text }]}
          placeholder="密码"
          placeholderTextColor={colors.placeholder}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        {!!error && <Text style={styles.error}>{error}</Text>}

        <TouchableOpacity
          style={[styles.btn, { backgroundColor: colors.primary }]}
          onPress={submit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={primaryInk} />
          ) : (
            <Text style={[styles.btnText, { color: primaryInk }]}>登录</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
          <Text style={[styles.link, { color: colors.primary }]}>还没有账号？去注册</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  inner: { flex: 1, justifyContent: 'center', paddingHorizontal: 28, gap: 10 },
  logoBox: {
    alignSelf: 'center',
    width: 72,
    height: 72,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  logo: { fontSize: 34, fontWeight: '800' },
  appName: {
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 2,
  },
  subtitle: { fontSize: 13, textAlign: 'center', marginBottom: 22 },
  input: {
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
  },
  error: { color: '#D85A30', fontSize: 13, textAlign: 'center' },
  btn: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#052E22',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  btnText: { fontSize: 16, fontWeight: '700' },
  link: { fontSize: 13, textAlign: 'center', marginTop: 16 },
})
