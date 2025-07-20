import { Link, type Href } from 'expo-router';
import { openBrowserAsync } from 'expo-web-browser';
import { type ComponentProps } from 'react';
import { Platform, View, Text } from 'react-native';

type Props = Omit<ComponentProps<typeof Link>, 'href'> & {
  href: string;
  style?: any;
};

export function ExternalLink({ href, style, children, ...rest }: Props) {
  return (
    <Link
      target="_blank"
      {...rest}
      href={href as unknown as Href}
      onPress={async (event) => {
        if (Platform.OS !== 'web') {
          event.preventDefault();
          await openBrowserAsync(href);
        }
      }}
    >
      {typeof children === 'string' ? (
        <Text style={style}>{children}</Text>
      ) : (
        <View style={style}>{children}</View>
      )}
    </Link>
  );
}
