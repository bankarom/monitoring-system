using System;
using System.Diagnostics;
using System.Drawing;
using System.Drawing.Imaging;
using System.IO;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading;
using System.Windows.Forms;

namespace ImproxTracker {
    class Program {
        [DllImport("user32.dll")]
        static extern IntPtr GetForegroundWindow();

        [DllImport("user32.dll", SetLastError = true, CharSet = CharSet.Auto)]
        static extern int GetWindowText(IntPtr hWnd, StringBuilder lpString, int nMaxCount);

        [DllImport("user32.dll", SetLastError = true)]
        static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint lpdwProcessId);

        [DllImport("user32.dll")]
        static extern short GetAsyncKeyState(int vKey);

        [DllImport("user32.dll")]
        static extern bool GetLastInputInfo(ref LASTINPUTINFO plii);

        [StructLayout(LayoutKind.Sequential)]
        struct LASTINPUTINFO {
            public uint cbSize;
            public uint dwTime;
        }

        static int clicks = 0;
        static int keys = 0;
        static byte[] prevKeys = new byte[256];

        static void InputPoller() {
            while (true) {
                try {
                    // Mouse clicks (Left, Right, Middle)
                    int[] mouseKeys = new int[] { 0x01, 0x02, 0x04 };
                    foreach (int vk in mouseKeys) {
                        short state = GetAsyncKeyState(vk);
                        bool isDown = (state & 0x8000) != 0;
                        if (isDown && prevKeys[vk] == 0) {
                            Interlocked.Increment(ref clicks);
                        }
                        prevKeys[vk] = (byte)(isDown ? 1 : 0);
                    }

                    // Keyboard keys 0x08 to 0xFE
                    for (int vk = 0x08; vk <= 0xFE; vk++) {
                        if (vk == 0x01 || vk == 0x02 || vk == 0x04) continue;
                        short state = GetAsyncKeyState(vk);
                        bool isDown = (state & 0x8000) != 0;
                        if (isDown && prevKeys[vk] == 0) {
                            Interlocked.Increment(ref keys);
                        }
                        prevKeys[vk] = (byte)(isDown ? 1 : 0);
                    }
                } catch {}
                Thread.Sleep(30);
            }
        }

        static string GetActiveApp(out string title) {
            title = "Desktop";
            IntPtr hwnd = GetForegroundWindow();
            if (hwnd == IntPtr.Zero) return "explorer.exe";

            StringBuilder sb = new StringBuilder(512);
            if (GetWindowText(hwnd, sb, 512) > 0) {
                title = sb.ToString();
            }

            uint pid;
            GetWindowThreadProcessId(hwnd, out pid);
            if (pid > 0) {
                try {
                    Process proc = Process.GetProcessById((int)pid);
                    return proc.ProcessName + ".exe";
                } catch {}
            }
            return "explorer.exe";
        }

        static uint GetIdleSeconds() {
            LASTINPUTINFO lii = new LASTINPUTINFO();
            lii.cbSize = (uint)Marshal.SizeOf(lii);
            if (GetLastInputInfo(ref lii)) {
                uint envTicks = (uint)Environment.TickCount;
                return (envTicks - lii.dwTime) / 1000;
            }
            return 0;
        }

        static string EscapeJson(string s) {
            if (string.IsNullOrEmpty(s)) return "";
            return s.Replace("\\", "\\\\").Replace("\"", "\\\"").Replace("\r", "").Replace("\n", " ");
        }

        static void Main(string[] args) {
            if (args.Length > 0 && args[0] == "--sample") {
                string title;
                string proc = GetActiveApp(out title);
                uint idleSec = GetIdleSeconds();
                string json = string.Format(
                    "{{\"processName\":\"{0}\",\"windowTitle\":\"{1}\",\"clicks\":0,\"keys\":0,\"idleSeconds\":{2}}}",
                    EscapeJson(proc),
                    EscapeJson(title),
                    idleSec
                );
                Console.WriteLine(json);
                return;
            }

            // Start background input poller thread
            Thread poller = new Thread(InputPoller);
            poller.IsBackground = true;
            poller.Start();

            // Loop on stdin
            string line;
            while ((line = Console.ReadLine()) != null) {
                line = line.Trim();
                if (line == "exit" || line == "quit") break;

                if (line == "sample") {
                    string title;
                    string proc = GetActiveApp(out title);
                    int currentClicks = Interlocked.Exchange(ref clicks, 0);
                    int currentKeys = Interlocked.Exchange(ref keys, 0);
                    uint idleSec = GetIdleSeconds();

                    string json = string.Format(
                        "{{\"processName\":\"{0}\",\"windowTitle\":\"{1}\",\"clicks\":{2},\"keys\":{3},\"idleSeconds\":{4}}}",
                        EscapeJson(proc),
                        EscapeJson(title),
                        currentClicks,
                        currentKeys,
                        idleSec
                    );
                    Console.WriteLine(json);
                }
            }
        }
    }
}