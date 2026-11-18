import { Redirect, useLocalSearchParams } from 'expo-router';

export default function SignupLink() {
  const { ref } = useLocalSearchParams<{ ref?: string }>();
  return <Redirect href={{ pathname: '/create-account', params: { type: 'user', ref: typeof ref === 'string' ? ref : '', chooseRole: 'true' } }} />;
}
