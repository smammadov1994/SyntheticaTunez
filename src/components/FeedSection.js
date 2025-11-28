import { FlatList, Image, StyleSheet, Text, View } from 'react-native';
import { HorizontalFeedCard } from './HorizontalFeedCard';
import { theme } from '../theme';

export const FeedSection = ({ title, avatar, data, type, onItemPress }) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {type === 'user' && avatar && (
          <Image source={{ uri: avatar }} style={styles.avatar} />
        )}
        <Text style={styles.title}>{title}</Text>
      </View>
      <FlatList
        data={data}
        renderItem={({ item }) => (
          <HorizontalFeedCard 
            item={item} 
            onPress={() => onItemPress?.(item)}
          />
        )}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        keyExtractor={(item) => item.id}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 32,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
    backgroundColor: theme.colors.gray.light,
  },
  title: {
    fontSize: 20,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.black,
  },
  listContent: {
    paddingHorizontal: 20,
  },
});


