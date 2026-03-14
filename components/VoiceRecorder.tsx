import { AppAlert } from '@/components/AppAlert';
import { AppText } from '@/components/AppText';
import { Colors, Spacing, borderRadius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import Slider from '@react-native-community/slider';
import { Audio } from 'expo-av';
import {
    PaperPlaneRight,
    Pause,
    Play,
    Stop,
    Trash
} from 'phosphor-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
    StyleSheet,
    View
} from 'react-native';
import Ripple from 'react-native-material-ripple';

interface VoiceRecorderProps {
  onSend: (uri: string, duration: number) => void;
  onCancel: () => void;
}

export function VoiceRecorder({ onSend, onCancel }: VoiceRecorderProps) {
  const colorScheme = (useColorScheme() ?? 'light') as 'light' | 'dark';
  const colors = Colors[colorScheme];

  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [uri, setUri] = useState<string | null>(null);
  
  const [status, setStatus] = useState<'idle' | 'recording' | 'preview' | 'playing' | 'paused'>('idle');
  const [permissionResponse, requestPermission] = Audio.usePermissions();
  
  const [durationMillis, setDurationMillis] = useState(0);
  const [positionMillis, setPositionMillis] = useState(0);
  const [recordingDuration, setRecordingDuration] = useState(0);
  
  const [alertVisible, setAlertVisible] = useState(false);

  const recordingTimer = useRef<any>(null);
  const playbackTimer = useRef<any>(null);

  useEffect(() => {
    startRecording();
    return () => {
      stopRecordingCleanup();
      unloadSound();
    };
  }, []);

  const formatTime = (millis: number) => {
    const totalSeconds = Math.floor(millis / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const startRecording = async () => {
    try {
      if (permissionResponse?.status !== 'granted') {
        const result = await requestPermission();
        if (!result.granted) {
            setAlertVisible(true);
            return;
        }
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      setRecording(recording);
      setStatus('recording');
      
      // Timer for recording duration
      const startTime = Date.now();
      recordingTimer.current = setInterval(() => {
        setRecordingDuration(Date.now() - startTime);
      }, 1000);

    } catch (err) {
      console.error('Failed to start recording', err);
      onCancel();
    }
  };

  const stopRecording = async () => {
    if (!recording) return;
    
    if (recordingTimer.current) {
        clearInterval(recordingTimer.current);
        recordingTimer.current = null;
    }

    try {
        await recording.stopAndUnloadAsync();
        const uri = recording.getURI();
        setUri(uri);
        setDurationMillis(recordingDuration); // Approximate or get explicit
        setRecording(null);
        setStatus('preview');
        // Reset mode for playback
        await Audio.setAudioModeAsync({
            allowsRecordingIOS: false,
            playsInSilentModeIOS: true,
        });
        loadSound(uri);
    } catch (error) {
        console.error('Failed to stop recording', error);
    }
  };

  const stopRecordingCleanup = async () => {
    if(recording) {
        try {
            await recording.stopAndUnloadAsync();
        } catch(e) {}
    }
    if (recordingTimer.current) clearInterval(recordingTimer.current);
  };

  const loadSound = async (uri: string | null) => {
      if(!uri) return;
      const { sound } = await Audio.Sound.createAsync(
          { uri },
          { shouldPlay: false },
          onPlaybackStatusUpdate
      );
      setSound(sound);
  };

  const unloadSound = async () => {
      if(sound) {
          await sound.unloadAsync();
      }
  };

  const onPlaybackStatusUpdate = (status: any) => {
      if(status.isLoaded) {
          setDurationMillis(status.durationMillis || 0);
          setPositionMillis(status.positionMillis);
          if(status.didJustFinish) {
              setStatus('preview');
              setPositionMillis(0); // Reset slider
              // sound?.setPositionAsync(0); // Optional: auto rewind
          }
      }
  };

  const playSound = async () => {
      if(sound) {
          if (positionMillis >= durationMillis) {
            await sound.setPositionAsync(0);
          }
          await sound.playAsync();
          setStatus('playing');
      }
  };

  const pauseSound = async () => {
      if(sound) {
          await sound.pauseAsync();
          setStatus('paused');
      }
  };

  const seekSound = async (value: number) => {
      if(sound) {
          await sound.setPositionAsync(value);
          setPositionMillis(value);
      }
  };

  const handleSend = () => {
      if(uri) {
          onSend(uri, durationMillis);
      }
  };

  if (status === 'recording' || status === 'idle') {
    return (
        <View style={[styles.container, { backgroundColor: colors.surface }]}>
            <View style={styles.recordingIndicator}>
                <View style={styles.redDot} />
                <AppText variant="bold" color={colors.error}>
                    {formatTime(recordingDuration)}
                </AppText>
            </View>
            
            <AppText size="sm" color={colors.textSecondary} style={{ flex: 1, textAlign: 'center' }}>
                Recording...
            </AppText>

            <Ripple 
              onPress={stopRecording} 
              style={styles.actionBtn}
              rippleCentered={true}
              rippleContainerBorderRadius={30}
            >
                <Stop size={24} color={colors.error} weight="fill" />
            </Ripple>
        </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, flexDirection: 'column', height: 'auto', paddingVertical: 12 }]}>
        
        {/* Playback Controls */}
        <View style={styles.row}>
             <Ripple 
                onPress={status === 'playing' ? pauseSound : playSound}
                rippleCentered={true}
                rippleContainerBorderRadius={20}
                style={{ padding: 8 }}
             >
                 {status === 'playing' ? (
                     <Pause size={24} color={colors.primary} weight="fill" />
                 ) : (
                     <Play size={24} color={colors.primary} weight="fill" />
                 )}
             </Ripple>

             <View style={styles.sliderContainer}>
                 <Slider
                    style={{ width: '100%', height: 40 }}
                    minimumValue={0}
                    maximumValue={durationMillis}
                    value={positionMillis}
                    minimumTrackTintColor={colors.primary}
                    maximumTrackTintColor={colors.border}
                    thumbTintColor={colors.primary}
                    onSlidingComplete={seekSound}
                 />
             </View>

             <AppText size="xs" color={colors.textSecondary} style={{ width: 70, textAlign: 'right' }}>
                 {formatTime(positionMillis)} / {formatTime(durationMillis)}
             </AppText>
        </View>

        {/* Action Buttons */}
        <View style={[styles.row, { justifyContent: 'space-between', marginTop: Spacing.sm, width: '100%' }]}>
             <Ripple 
                onPress={onCancel} 
                style={[styles.secondaryBtn, { backgroundColor: colors.surface }]}
                rippleContainerBorderRadius={8}
             >
                 <Trash size={20} color={colors.error} />
                 <AppText size="sm" color={colors.error} style={{ marginLeft: 4 }}>Delete</AppText>
             </Ripple>

             <Ripple 
                onPress={handleSend} 
                style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
                rippleColor="#FFF"
                rippleContainerBorderRadius={8}
             >
                 <PaperPlaneRight size={20} color="#FFF" weight="fill" />
                 <AppText size="sm" color="#FFF" style={{ marginLeft: 4 }} variant="bold">Send Voice</AppText>
             </Ripple>
        </View>

        <AppAlert 
            visible={alertVisible}
            title="Permission needed"
            message="Please grant microphone permission to record voice notes."
            type="error"
            onConfirm={() => {
                setAlertVisible(false);
                onCancel();
            }}
        />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    flexDirection: 'row',
  },
  recordingIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
  },
  redDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: '#FF3B30',
  },
  actionBtn: {
      padding: 8,
  },
  row: {
      flexDirection: 'row',
      alignItems: 'center',
  },
  sliderContainer: {
      flex: 1,
      marginHorizontal: Spacing.sm,
  },
  primaryBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 20,
  },
  secondaryBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 20,
      // borderColor: '#E5E5E5',
      // borderWidth: 1,
  }
});
