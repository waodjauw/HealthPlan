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

export function RegisterScreen({ navigation }: { navigation: any }) {
  const { colors } = useTheme()
  const { primaryInk } = colors
  const { register } = useAuth()
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit() {
    if (!email.trim() || !username.trim() || !password) {
      setError('请填写完整信息')
      return
    }
    if (password.length < 6) {
      setError('密码至少 6 位')
      return
    }
    setLoading(true)
    setError('')
    try {
      await register(email.trim(), username.trim(), password)
    } catch (e: any) {
      setError(e?.response?.data?.message ?? '注册失败，请换一个邮箱或用户名')
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
        <Text style={[styles.title, { color: colors.text }]}>创建账号</Text>

        <TextInput
          style={[styles.input, { backgroundColor: colors.cardAlt, color: colors.text }]}
          placeholder="邮箱"
          placeholderTextColor={colors.placeholder}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TextInput
          style={[styles.input, { backgroundColor: colors.cardAlt, color: colors.text }]}
          placeholder="用户名"
          placeholderTextColor={colors.placeholder}
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
        />
        <TextInput
          style={[styles.input, { backgroundColor: colors.cardAlt, color: colors.text }]}
          placeholder="密码（至少 6 位）"
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
            <Text style={[styles.btnText, { color: primaryInk }]}>注册并登录</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={[styles.link, { color: colors.primary }]}>已有账号？去登录</Text>
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
  title: {
    fontSize: 21,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: 1,
  },
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
